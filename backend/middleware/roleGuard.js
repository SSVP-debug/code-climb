/**
 * roleGuard — role-based access middleware.
 * Usage: requireRole("recruiter") or requireRole("tpo", "admin")
 * Always chain AFTER requireAuth so req.userDoc is populated.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.userDoc?.role ?? "student";
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}.`,
        yourRole: userRole,
      });
    }
    next();
  };
}

/**
 * requireAdmin — for admin-only routes (the approval queue, the users
 * list, impersonation controls). Unlike requireRole("admin"), this checks
 * req.actingAdminDoc first: while an admin is actively impersonating
 * someone, req.userDoc.role reflects the *target's* role (by design —
 * every other route should behave exactly as that user), so a plain
 * requireRole("admin") would lock the admin out of switching targets or
 * exiting. req.actingAdminDoc is only ever set by requireAuth during an
 * active impersonation, so this can't be spoofed by a request header.
 */
export function requireAdmin(req, res, next) {
  const effectiveRole = req.actingAdminDoc?.role || req.userDoc?.role || "student";
  if (effectiveRole !== "admin") {
    return res.status(403).json({
      error: "Access denied. Required role: admin.",
      yourRole: effectiveRole,
    });
  }
  next();
}