import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "./sanitizeFilename";

describe("sanitizeFilename", () => {
  it("replaces slashes so a CC ID stays readable instead of losing its separator", () => {
    expect(sanitizeFilename("CC/027")).toBe("CC-027");
  });

  it("strips characters invalid on Windows/most filesystems", () => {
    expect(sanitizeFilename('Fellowship: "Fall 2026"?')).not.toMatch(/[/\\?%*:|"<>]/);
  });

  it("collapses whitespace and repeated separators into single hyphens", () => {
    expect(sanitizeFilename("MLH   Fellowship -- Fall")).toBe("MLH-Fellowship-Fall");
  });

  it("produces the exact expected filename for a realistic share-card download", () => {
    const result = `${sanitizeFilename("CC/027")}-${sanitizeFilename("MLH Fellowship")}-WhatsApp.png`;
    expect(result).toBe("CC-027-MLH-Fellowship-WhatsApp.png");
  });

  it("caps length so a very long title can't produce an unwieldy filename", () => {
    const long = "A".repeat(200);
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(80);
  });

  it("falls back to 'file' for empty or fully-invalid input", () => {
    expect(sanitizeFilename("")).toBe("file");
    expect(sanitizeFilename("???")).toBe("file");
  });
});
