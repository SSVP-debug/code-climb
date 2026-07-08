export function requireVerified(req, res, next) {
    const role = req.userDoc?.role;

    // Admins bypass verification.
    if (role === "admin") {
        return next();
    }

    // Recruiter verification.
    if (role === "recruiter") {
        if (req.userDoc?.recruiterProfile?.verified) {
            return next();
        }

        return res.status(403).json({
            error: "Your recruiter account is pending verification.",
            status: "pending",
        });
    }

    // Future-proof for TPO verification.
    if (role === "tpo") {
        return next();

        return res.status(403).json({
            error: "Your TPO account is pending verification.",
            status: "pending",
        });
    }

    return res.status(403).json({
        error: "Verification required.",
    });
}