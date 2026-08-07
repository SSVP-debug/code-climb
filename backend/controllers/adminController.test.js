import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/College.js", () => ({
    default: {
        find: vi.fn(),
        findById: vi.fn(),
        deleteOne: vi.fn(),
    },
}));
vi.mock("../models/User.js", () => ({
    default: {
        find: vi.fn(),
        findById: vi.fn(),
        updateMany: vi.fn(),
        countDocuments: vi.fn(),
    },
}));
vi.mock("../models/ImpersonationLog.js", () => ({
    default: { updateOne: vi.fn(), create: vi.fn() },
}));
vi.mock("../models/AdminAuditLog.js", () => ({
    default: { find: vi.fn(), countDocuments: vi.fn(), create: vi.fn() },
}));
vi.mock("../services/notificationService.js", () => ({
    createNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/adminAuditLog.js", () => ({
    recordAdminAction: vi.fn(),
}));
vi.mock("../utils/userAuthCache.js", () => ({
    invalidateCachedUserByFirebaseUid: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import College from "../models/College.js";
import User from "../models/User.js";
import ImpersonationLog from "../models/ImpersonationLog.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { createNotification } from "../services/notificationService.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { invalidateCachedUserByFirebaseUid } from "../utils/userAuthCache.js";
import {
    getPendingQueue,
    approveRecruiter,
    rejectRecruiter,
    approveTpo,
    rejectTpo,
    approveStudentCollege,
    rejectStudentCollege,
    listUsers,
    getAuditLogs,
    startImpersonation,
    stopImpersonation,
} from "./adminController.js";

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

// Minimal stand-in for a chainable Mongoose query (.sort().populate() etc.
// all return the same object; .lean() is the async terminal call).
function chainableQuery(result) {
    const q = {
        sort: vi.fn(() => q),
        populate: vi.fn(() => q),
        select: vi.fn(() => q),
        skip: vi.fn(() => q),
        limit: vi.fn(() => q),
        lean: vi.fn().mockResolvedValue(result),
    };
    return q;
}

function makeUser(overrides = {}) {
    return {
        _id: "u1",
        firebaseUid: "fb-1",
        email: "u1@b.com",
        role: "recruiter",
        recruiterProfile: { companyName: "Acme", verified: false, verifiedAt: null },
        save: vi.fn().mockResolvedValue(true),
        ...overrides,
    };
}

// The acting admin identity every mutating admin route reads via
// req.actingAdminDoc || req.userDoc (see startImpersonation/stopImpersonation,
// now also recordAdminAction call sites added by plan 002).
function makeAdmin(overrides = {}) {
    return makeUser({ _id: "admin1", role: "admin", email: "admin@codeclub.dev", ...overrides });
}

describe("adminController", () => {
    let res;

    beforeEach(() => {
        vi.clearAllMocks();
        res = mockRes();
    });

    describe("getPendingQueue", () => {
        it("returns pending recruiters, split into TPO and student college requests by submittedByRole", async () => {
            User.find.mockReturnValueOnce(
                chainableQuery([
                    { _id: "r1", email: "r@b.com", displayName: "R", recruiterProfile: { companyName: "Acme" }, createdAt: "t1" },
                ])
            );
            College.find.mockReturnValueOnce(
                chainableQuery([
                    {
                        _id: "c1", name: "MIT", domains: ["mit.edu"],
                        submittedBy: { email: "a@b.com", displayName: "A" },
                        submittedByRole: "tpo",
                        createdAt: "t2",
                    },
                    {
                        _id: "c2", name: "XYZ Institute", domains: ["xyz.ac.in"], website: "https://xyz.ac.in",
                        submittedBy: { email: "s@b.com", displayName: "S" },
                        submittedByRole: "student",
                        createdAt: "t3",
                    },
                ])
            );

            const req = {};
            await getPendingQueue(req, res);

            expect(College.find).toHaveBeenCalledWith({ status: "pending" });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    recruiters: [expect.objectContaining({ id: "r1", companyName: "Acme" })],
                    tpos: [expect.objectContaining({ collegeId: "c1", collegeName: "MIT", domain: "mit.edu" })],
                    studentCollegeRequests: [
                        expect.objectContaining({ collegeId: "c2", collegeName: "XYZ Institute", domains: ["xyz.ac.in"] }),
                    ],
                })
            );
        });

        it("returns 500 if the query fails", async () => {
            User.find.mockImplementationOnce(() => {
                throw new Error("db down");
            });

            await getPendingQueue({}, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("approveRecruiter", () => {
        it("verifies the recruiter, invalidates their auth cache, notifies them, and audit-logs it", async () => {
            const user = makeUser();
            const admin = makeAdmin();
            User.findById.mockResolvedValueOnce(user);

            await approveRecruiter({ params: { id: "u1" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(user.recruiterProfile.verified).toBe(true);
            expect(user.save).toHaveBeenCalledOnce();
            expect(invalidateCachedUserByFirebaseUid).toHaveBeenCalledWith("fb-1");
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "recruiter.approve", targetType: "User", targetId: "u1" })
            );
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "u1", type: "recruiter_verified" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("404s when the target isn't a recruiter", async () => {
            User.findById.mockResolvedValueOnce(makeUser({ role: "student" }));

            await approveRecruiter({ params: { id: "u1" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("rejectRecruiter", () => {
        it("demotes the user back to student, invalidates their auth cache, and audit-logs it", async () => {
            const user = makeUser();
            const admin = makeAdmin();
            User.findById.mockResolvedValueOnce(user);

            await rejectRecruiter({ params: { id: "u1" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(user.role).toBe("student");
            expect(user.recruiterProfile.verified).toBe(false);
            expect(invalidateCachedUserByFirebaseUid).toHaveBeenCalledWith("fb-1");
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "recruiter.reject", targetType: "User", targetId: "u1" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe("approveTpo", () => {
        it("verifies the college, bulk-verifies matching pending TPO profiles, and audit-logs it", async () => {
            const college = {
                _id: "c1",
                domains: ["mit.edu"],
                name: "MIT",
                submittedBy: "admin-user-1",
                status: "pending",
                save: vi.fn().mockResolvedValue(true),
            };
            const admin = makeAdmin();
            College.findById.mockResolvedValueOnce(college);
            User.updateMany.mockResolvedValueOnce({ modifiedCount: 3 });

            await approveTpo({ params: { collegeId: "c1" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(college.status).toBe("verified");
            expect(User.updateMany).toHaveBeenCalledWith(
                { role: "tpo", "tpoProfile.collegeDomain": { $in: ["mit.edu"] }, "tpoProfile.verified": false },
                expect.objectContaining({ $set: expect.any(Object) })
            );
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "tpo.approve", targetType: "College", targetId: "c1" })
            );
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "admin-user-1", type: "tpo_verified" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("404s when the college request doesn't exist", async () => {
            College.findById.mockResolvedValueOnce(null);

            await approveTpo({ params: { collegeId: "missing" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("rejectTpo", () => {
        it("deletes the college, demotes the requester if still a TPO, and audit-logs it", async () => {
            const college = { _id: "c1", name: "MIT", submittedBy: "req1" };
            const requester = makeUser({ _id: "req1", role: "tpo", firebaseUid: "fb-req1" });
            const admin = makeAdmin();

            College.findById.mockResolvedValueOnce(college);
            User.findById.mockResolvedValueOnce(requester);

            await rejectTpo({ params: { collegeId: "c1" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(College.deleteOne).toHaveBeenCalledWith({ _id: "c1" });
            expect(requester.role).toBe("student");
            expect(invalidateCachedUserByFirebaseUid).toHaveBeenCalledWith("fb-req1");
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "tpo.reject", targetType: "College", targetId: "c1" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe("approveStudentCollege", () => {
        it("verifies the college and pushes collegeStatus to every linked, email-verified user", async () => {
            const college = {
                _id: "c2",
                domains: ["xyz.ac.in"],
                name: "XYZ Institute",
                status: "pending",
                save: vi.fn().mockResolvedValue(true),
            };
            const linkedUser = makeUser({
                _id: "stu1",
                role: "student",
                firebaseUid: "fb-stu1",
                education: { collegeId: "c2", emailVerified: true, collegeStatus: "pending" },
            });
            College.findById.mockResolvedValueOnce(college);
            User.find.mockResolvedValueOnce([linkedUser]);

            const admin = makeAdmin();
            await approveStudentCollege({ params: { collegeId: "c2" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(college.status).toBe("verified");
            expect(User.find).toHaveBeenCalledWith({
                "education.collegeId": "c2",
                "education.emailVerified": true,
            });
            expect(linkedUser.education.collegeStatus).toBe("verified");
            expect(linkedUser.save).toHaveBeenCalledOnce();
            expect(invalidateCachedUserByFirebaseUid).toHaveBeenCalledWith("fb-stu1");
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "studentCollege.approve", targetType: "College", targetId: "c2" })
            );
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "stu1", type: "college_verified" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("404s when the college request doesn't exist", async () => {
            College.findById.mockResolvedValueOnce(null);

            await approveStudentCollege({ params: { collegeId: "missing" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("rejectStudentCollege", () => {
        it("does NOT delete the college doc — marks it rejected, updates linked users, and audit-logs it", async () => {
            const college = {
                _id: "c2",
                domains: ["xyz.ac.in"],
                name: "XYZ Institute",
                status: "pending",
                save: vi.fn().mockResolvedValue(true),
            };
            const linkedUser = makeUser({
                _id: "stu1",
                role: "student",
                firebaseUid: "fb-stu1",
                education: { collegeId: "c2", emailVerified: true, collegeStatus: "pending" },
            });
            College.findById.mockResolvedValueOnce(college);
            User.find.mockResolvedValueOnce([linkedUser]);

            const admin = makeAdmin();
            await rejectStudentCollege({ params: { collegeId: "c2" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(college.status).toBe("rejected");
            expect(College.deleteOne).not.toHaveBeenCalled();
            expect(linkedUser.education.collegeStatus).toBe("rejected");
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "studentCollege.reject", targetType: "College", targetId: "c2" })
            );
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({ userId: "stu1", type: "college_rejected" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("404s when the college request doesn't exist", async () => {
            College.findById.mockResolvedValueOnce(null);

            await rejectStudentCollege({ params: { collegeId: "missing" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("listUsers", () => {
        it("paginates and excludes admins by default", async () => {
            User.find.mockReturnValueOnce(
                chainableQuery([{ _id: "s1", displayName: "S", email: "s@b.com", username: "s1", role: "student", createdAt: "t" }])
            );
            User.countDocuments.mockResolvedValueOnce(1);

            await listUsers({ query: {} }, res);

            expect(User.find).toHaveBeenCalledWith(
                expect.objectContaining({ role: { $ne: "admin" } }),
                expect.any(String)
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ total: 1, page: 1, limit: 20 })
            );
        });
    });

    describe("getAuditLogs", () => {
        it("returns paginated logs sorted newest-first", async () => {
            const entries = [
                { _id: "l1", adminEmail: "admin@codeclub.dev", action: "recruiter.approve", targetType: "User", targetId: "u1", createdAt: "t2" },
            ];
            AdminAuditLog.find.mockReturnValueOnce(chainableQuery(entries));
            AdminAuditLog.countDocuments.mockResolvedValueOnce(1);

            await getAuditLogs({ query: {} }, res);

            expect(AdminAuditLog.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ logs: entries, total: 1, page: 1, limit: 20 })
            );
        });

        it("filters by action, adminId, and date range", async () => {
            AdminAuditLog.find.mockReturnValueOnce(chainableQuery([]));
            AdminAuditLog.countDocuments.mockResolvedValueOnce(0);

            await getAuditLogs(
                {
                    query: {
                        action: "recruiter.approve",
                        adminId: "admin1",
                        startDate: "2026-01-01",
                        endDate: "2026-01-31",
                    },
                },
                res
            );

            expect(AdminAuditLog.find).toHaveBeenCalledWith({
                action: "recruiter.approve",
                adminId: "admin1",
                createdAt: { $gte: new Date("2026-01-01"), $lte: new Date("2026-01-31") },
            });
        });

        it("clamps page/limit the same way listUsers does", async () => {
            AdminAuditLog.find.mockReturnValueOnce(chainableQuery([]));
            AdminAuditLog.countDocuments.mockResolvedValueOnce(0);

            await getAuditLogs({ query: { page: "0", limit: "500" } }, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1, limit: 50 })
            );
        });

        it("returns 500 if the query fails", async () => {
            AdminAuditLog.find.mockImplementationOnce(() => {
                throw new Error("db down");
            });

            await getAuditLogs({ query: {} }, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("startImpersonation", () => {
        it("swaps the admin into impersonating the target and logs it", async () => {
            const admin = makeUser({ _id: "admin1", role: "admin" });
            const target = makeUser({ _id: "target1", role: "student", firebaseUid: "fb-target" });
            User.findById.mockResolvedValueOnce(target);

            const req = { userDoc: admin, actingAdminDoc: null, params: { userId: "target1" } };
            await startImpersonation(req, res);

            expect(admin.impersonating.targetUserId).toBe("target1");
            expect(ImpersonationLog.create).toHaveBeenCalledWith(
                expect.objectContaining({ adminId: "admin1", targetUserId: "target1" })
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, impersonating: expect.objectContaining({ id: "target1" }) })
            );
        });

        it("refuses to impersonate another admin", async () => {
            const admin = makeUser({ _id: "admin1", role: "admin" });
            User.findById.mockResolvedValueOnce(makeUser({ _id: "target1", role: "admin" }));

            await startImpersonation(
                { userDoc: admin, actingAdminDoc: null, params: { userId: "target1" } },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("closes out the previous ImpersonationLog entry when switching targets", async () => {
            const admin = makeUser({
                _id: "admin1",
                role: "admin",
                impersonating: { targetUserId: "old-target", startedAt: new Date() },
            });
            const newTarget = makeUser({ _id: "target2", role: "student" });
            User.findById.mockResolvedValueOnce(newTarget);

            await startImpersonation(
                { userDoc: admin, actingAdminDoc: null, params: { userId: "target2" } },
                res
            );

            expect(ImpersonationLog.updateOne).toHaveBeenCalledWith(
                expect.objectContaining({ adminId: "admin1", targetUserId: "old-target" }),
                expect.objectContaining({ $set: { endedAt: expect.any(Date) } })
            );
        });
    });

    describe("stopImpersonation", () => {
        it("clears the impersonation pointer and closes the log entry", async () => {
            const admin = makeUser({
                _id: "admin1",
                role: "admin",
                impersonating: { targetUserId: "target1", startedAt: new Date() },
            });

            await stopImpersonation({ userDoc: admin, actingAdminDoc: null }, res);

            expect(ImpersonationLog.updateOne).toHaveBeenCalledOnce();
            expect(admin.impersonating).toEqual({ targetUserId: null, startedAt: null });
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });
});