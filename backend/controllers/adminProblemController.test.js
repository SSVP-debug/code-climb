import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
    default: {
        find: vi.fn(),
        findOne: vi.fn(),
        countDocuments: vi.fn(),
        create: vi.fn(),
        deleteOne: vi.fn(),
    },
}));
vi.mock("./problemController.js", () => ({
    invalidateProblemsCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/adminAuditLog.js", () => ({
    recordAdminAction: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import Problem from "../models/Problem.js";
import { invalidateProblemsCache } from "./problemController.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import {
    listProblemsForAdmin,
    getProblemForAdmin,
    createProblem,
    updateProblem,
    deleteProblem,
} from "./adminProblemController.js";

function chainableQuery(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(result),
    };
}

const VALID_CREATE_PAYLOAD = {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays",
    functionName: "twoSum",
    description: "Find two numbers that add up to target.",
    testcases: [],
    hiddentestcases: [],
    starterCode: { python: "", javascript: "", java: "", cpp: "" },
};

function makeAdmin(overrides = {}) {
    return { _id: "admin1", email: "admin@codeclub.dev", role: "admin", ...overrides };
}

function makeProblemDoc(overrides = {}) {
    return {
        _id: "p1",
        id: 42,
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        topic: "Arrays",
        pattern: "",
        sourceType: "core",
        adminSource: "catalog",
        save: vi.fn().mockResolvedValue(true),
        ...overrides,
    };
}

describe("adminProblemController", () => {
    let res;

    beforeEach(() => {
        vi.clearAllMocks();
        res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    });

    describe("listProblemsForAdmin", () => {
        it("lists problems including adminSource, paginated", async () => {
            Problem.find.mockReturnValueOnce(chainableQuery([makeProblemDoc()]));
            Problem.countDocuments.mockResolvedValueOnce(1);

            await listProblemsForAdmin({ query: {} }, res);

            expect(Problem.find).toHaveBeenCalledWith(
                {},
                expect.stringContaining("adminSource")
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ total: 1, page: 1, limit: 20 })
            );
        });

        it("filters by adminSource", async () => {
            Problem.find.mockReturnValueOnce(chainableQuery([]));
            Problem.countDocuments.mockResolvedValueOnce(0);

            await listProblemsForAdmin({ query: { adminSource: "admin" } }, res);

            expect(Problem.find).toHaveBeenCalledWith(
                expect.objectContaining({ adminSource: "admin" }),
                expect.any(String)
            );
        });
    });

    describe("getProblemForAdmin", () => {
        it("returns full detail including hiddentestcases (no publicFields strip)", async () => {
            const doc = makeProblemDoc({ hiddentestcases: [{ input: {}, expectedOutput: 1 }] });
            Problem.findOne.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(doc) });

            await getProblemForAdmin({ params: { slug: "two-sum" } }, res);

            expect(res.json).toHaveBeenCalledWith({ problem: doc });
        });

        it("404s when the problem doesn't exist", async () => {
            Problem.findOne.mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) });

            await getProblemForAdmin({ params: { slug: "missing" } }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe("createProblem", () => {
        it("creates with adminSource: admin, an id past the catalog range, invalidates cache, and audit-logs it", async () => {
            Problem.findOne.mockReturnValueOnce({
                sort: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue({ id: 250 }),
            });
            const admin = makeAdmin();
            Problem.create.mockResolvedValueOnce({ _id: "newp1", slug: "two-sum", id: 100000 });

            await createProblem({ body: VALID_CREATE_PAYLOAD, userDoc: admin, actingAdminDoc: null }, res);

            expect(Problem.create).toHaveBeenCalledWith(
                expect.objectContaining({ slug: "two-sum", adminSource: "admin", id: 100000 })
            );
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "problem.create" })
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("400s on an invalid payload (missing required field) without touching the DB", async () => {
            const { title, ...invalidPayload } = VALID_CREATE_PAYLOAD;
            void title;

            await createProblem({ body: invalidPayload, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(Problem.create).not.toHaveBeenCalled();
        });

        it("409s on a duplicate slug instead of a raw 500", async () => {
            Problem.findOne.mockReturnValueOnce({
                sort: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                lean: vi.fn().mockResolvedValue(null),
            });
            const dupError = new Error("duplicate key");
            dupError.code = 11000;
            Problem.create.mockRejectedValueOnce(dupError);

            await createProblem({ body: VALID_CREATE_PAYLOAD, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });
    });

    describe("updateProblem", () => {
        it("accepts safelisted fields (topic/pattern/sourceType) on a catalog problem", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                { params: { slug: "two-sum" }, body: { topic: "Hash Table" }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(doc.topic).toBe("Hash Table");
            expect(doc.save).toHaveBeenCalledOnce();
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: "problem.update_safelisted" })
            );
            expect(res.json).toHaveBeenCalledWith({ problem: doc });
        });

        it("400s a non-safelisted field on a catalog problem, without saving", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                { params: { slug: "two-sum" }, body: { title: "New Title" }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(doc.save).not.toHaveBeenCalled();
        });

        it("400s when a catalog update mixes a safelisted and non-safelisted field in the same request", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                {
                    params: { slug: "two-sum" },
                    body: { topic: "Hash Table", description: "sneaky full edit" },
                    userDoc: makeAdmin(),
                    actingAdminDoc: null,
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(doc.save).not.toHaveBeenCalled();
        });

        it("accepts any field on an admin-sourced problem", async () => {
            const doc = makeProblemDoc({ adminSource: "admin", description: "old" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                {
                    params: { slug: "two-sum" },
                    body: { description: "new description text" },
                    userDoc: makeAdmin(),
                    actingAdminDoc: null,
                },
                res
            );

            expect(doc.description).toBe("new description text");
            expect(doc.save).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: "problem.update" })
            );
        });

        it("404s when the problem doesn't exist", async () => {
            Problem.findOne.mockResolvedValueOnce(null);

            await updateProblem(
                { params: { slug: "missing" }, body: { topic: "x" }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(res.status).toHaveBeenCalledWith(404);
        });

        // ── Content & Execution Architecture, Phase 1 ────────────────────
        it("accepts `enabled` on a catalog problem via the safelist", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog", enabled: true });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                { params: { slug: "two-sum" }, body: { enabled: false }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(doc.enabled).toBe(false);
            expect(doc.save).toHaveBeenCalledOnce();
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: "problem.update_safelisted" })
            );
        });

        it("rejects a non-boolean `enabled` value on a catalog problem", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                { params: { slug: "two-sum" }, body: { enabled: "nope" }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(doc.save).not.toHaveBeenCalled();
        });

        it("accepts `enabled` on an admin-sourced problem through the full-update path", async () => {
            const doc = makeProblemDoc({ adminSource: "admin", enabled: true });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                { params: { slug: "two-sum" }, body: { enabled: false }, userDoc: makeAdmin(), actingAdminDoc: null },
                res
            );

            expect(doc.enabled).toBe(false);
            expect(doc.save).toHaveBeenCalledOnce();
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
        });

        // ── Content & Execution Architecture cross-check follow-up ────────
        // Previously only reachable for admin-sourced problems — see
        // adminProblemController.js's own comment on why this is safe to
        // extend to catalog problems now.
        it("accepts `hiddenTestcaseSetEnabled` on a catalog problem via the safelist, mapped onto the nested field", async () => {
            const doc = makeProblemDoc({
                adminSource: "catalog",
                hiddenTestcaseSet: { enabled: true, testcases: [{ input: "1", expectedOutput: "1" }] },
            });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                {
                    params: { slug: "two-sum" },
                    body: { hiddenTestcaseSetEnabled: false },
                    userDoc: makeAdmin(),
                    actingAdminDoc: null,
                },
                res
            );

            expect(doc.hiddenTestcaseSet.enabled).toBe(false);
            // Untouched — this must only ever flip the enabled flag, never
            // the testcases array itself.
            expect(doc.hiddenTestcaseSet.testcases).toEqual([{ input: "1", expectedOutput: "1" }]);
            expect(doc.save).toHaveBeenCalledOnce();
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: "problem.update_safelisted",
                    details: expect.objectContaining({
                        changed: expect.objectContaining({
                            hiddenTestcaseSetEnabled: { from: true, to: false },
                        }),
                    }),
                })
            );
        });

        it("rejects a non-boolean `hiddenTestcaseSetEnabled` value on a catalog problem", async () => {
            const doc = makeProblemDoc({
                adminSource: "catalog",
                hiddenTestcaseSet: { enabled: true, testcases: [] },
            });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                {
                    params: { slug: "two-sum" },
                    body: { hiddenTestcaseSetEnabled: "nope" },
                    userDoc: makeAdmin(),
                    actingAdminDoc: null,
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(doc.save).not.toHaveBeenCalled();
        });

        it("still rejects a field outside the safelist on a catalog problem (unchanged behavior)", async () => {
            const doc = makeProblemDoc({ adminSource: "catalog" });
            Problem.findOne.mockResolvedValueOnce(doc);

            await updateProblem(
                {
                    params: { slug: "two-sum" },
                    body: { functionName: "hacked" },
                    userDoc: makeAdmin(),
                    actingAdminDoc: null,
                },
                res
            );

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ disallowedFields: ["functionName"] })
            );
            expect(doc.save).not.toHaveBeenCalled();
        });
    });

    describe("deleteProblem", () => {
        it("403s on a catalog problem — it would just reappear on the next seed run", async () => {
            Problem.findOne.mockResolvedValueOnce(makeProblemDoc({ adminSource: "catalog" }));

            await deleteProblem({ params: { slug: "two-sum" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Problem.deleteOne).not.toHaveBeenCalled();
        });

        it("succeeds on an admin-sourced problem, invalidates cache, and audit-logs it", async () => {
            const doc = makeProblemDoc({ adminSource: "admin", _id: "p1" });
            Problem.findOne.mockResolvedValueOnce(doc);
            const admin = makeAdmin();

            await deleteProblem({ params: { slug: "two-sum" }, userDoc: admin, actingAdminDoc: null }, res);

            expect(Problem.deleteOne).toHaveBeenCalledWith({ _id: "p1" });
            expect(invalidateProblemsCache).toHaveBeenCalledOnce();
            expect(recordAdminAction).toHaveBeenCalledWith(
                expect.objectContaining({ adminDoc: admin, action: "problem.delete", targetType: "Problem", targetId: "p1" })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("404s when the problem doesn't exist", async () => {
            Problem.findOne.mockResolvedValueOnce(null);

            await deleteProblem({ params: { slug: "missing" }, userDoc: makeAdmin(), actingAdminDoc: null }, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});