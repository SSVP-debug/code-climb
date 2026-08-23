import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ShareCardCanvas from "./ShareCardCanvas";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn((url) => Promise.resolve(`data:image/png;base64,MOCKED-QR-FOR:${url}`)),
  },
}));

function opportunity(overrides = {}) {
  return {
    ccId: "CC/027",
    ccNumber: 27,
    title: "MLH Fellowship",
    organization: "Major League Hacking",
    type: "fellowship",
    category: "Software Engineering",
    workMode: "remote",
    applicationDeadline: "2026-08-31T00:00:00.000Z",
    verificationStatus: "unverified",
    ...overrides,
  };
}

describe("ShareCardCanvas", () => {
  it("renders the QR code pointing to the Code Club opportunity URL, never the external application URL", async () => {
    render(<ShareCardCanvas opportunity={opportunity()} format="mobile" />);

    await waitFor(() => {
      const img = screen.getByAltText(/QR code/i);
      expect(img.src).toContain("/opportunities/27");
    });
  });

  it("appends the sourceTag as a ?source= query param on the QR URL when provided", async () => {
    render(<ShareCardCanvas opportunity={opportunity()} format="mobile" sourceTag="whatsapp" />);

    await waitFor(() => {
      const img = screen.getByAltText(/QR code/i);
      expect(img.src).toContain("source=whatsapp");
    });
  });

  it("omits the source param entirely when no sourceTag is given", async () => {
    render(<ShareCardCanvas opportunity={opportunity()} format="mobile" />);

    await waitFor(() => {
      const img = screen.getByAltText(/QR code/i);
      expect(img.src).not.toContain("source=");
    });
  });

  it("shows the VERIFIED badge only when verificationStatus is 'verified'", async () => {
    const { rerender } = render(
      <ShareCardCanvas opportunity={opportunity({ verificationStatus: "unverified" })} format="mobile" />
    );
    await screen.findByAltText(/QR code/i);
    expect(screen.queryByText(/VERIFIED BY CODE CLUB/i)).not.toBeInTheDocument();

    rerender(<ShareCardCanvas opportunity={opportunity({ verificationStatus: "verified" })} format="mobile" />);
    await screen.findByText(/VERIFIED BY CODE CLUB/i);
  });

  it("renders the opportunity's own title, organization, and CC ID (data-driven, not hardcoded)", async () => {
    render(
      <ShareCardCanvas
        opportunity={opportunity({ ccId: "CC/099", title: "ISRO Internship", organization: "ISRO" })}
        format="linkedin"
      />
    );
    await screen.findByAltText(/QR code/i);
    expect(screen.getByText("CC/099")).toBeInTheDocument();
    expect(screen.getByText("ISRO Internship")).toBeInTheDocument();
    expect(screen.getByText("ISRO")).toBeInTheDocument();
  });

  it("renders Code Club branding on both mobile and linkedin formats", async () => {
    const { rerender } = render(<ShareCardCanvas opportunity={opportunity()} format="mobile" />);
    await screen.findByAltText(/QR code/i);
    expect(screen.getByText("CODE CLUB")).toBeInTheDocument();
    expect(screen.getByText("OPPORTUNITY RADAR")).toBeInTheDocument();

    rerender(<ShareCardCanvas opportunity={opportunity()} format="linkedin" />);
    await screen.findByAltText(/QR code/i);
    expect(screen.getByText("CODE CLUB")).toBeInTheDocument();
    expect(screen.getByText("OPPORTUNITY RADAR")).toBeInTheDocument();
  });
});
