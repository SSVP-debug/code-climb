import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateBody } from "./validateBody.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("validateBody", () => {
  const schema = z.object({
    name: z.string().min(1, "name is required"),
    count: z.number().int().positive().optional().default(1),
  });

  it("calls next() and replaces req.body with the parsed/coerced value on success", () => {
    const req = { body: { name: "widget" } };
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "widget", count: 1 }); // default applied
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with the first error's message and field path on failure", () => {
    const req = { body: { name: "" } };
    const res = mockRes();
    const next = vi.fn();

    validateBody(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "name is required", field: "name" })
    );
  });

  it("never throws, even on a completely malformed body", () => {
    const req = { body: null };
    const res = mockRes();
    const next = vi.fn();

    expect(() => validateBody(schema)(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
