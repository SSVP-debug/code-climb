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
