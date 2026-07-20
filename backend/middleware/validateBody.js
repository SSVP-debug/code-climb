/**
 * Reusable Zod request-body validation middleware.
 *
 * Moved out of routes/compiler.js (where it originated and was imported
 * from by routes/judge.js, routes/dailyChallenge.js, routes/progress.js)
 * into its own module — a shared validation helper living inside one
 * specific route file was exactly the kind of ambiguity the Staff review
 * (§3/§9/#11) called out: "no consistent zod-everywhere policy... no rule
 * for which pattern a new route should follow."
 *
 * Usage: router.post("/path", validateBody(schema), handler)
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request body",
        field: firstError?.path?.join(".") || undefined,
      });
    }

    // Replace req.body with the validated + coerced value (e.g. defaults
    // applied, strings trimmed) so handlers never need to re-validate.
    req.body = result.data;
    next();
  };
}
