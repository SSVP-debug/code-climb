import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import VerificationBadge from "./VerificationBadge";

describe("VerificationBadge", () => {
  it("shows 'Verified by Code Club' only when verificationStatus is 'verified'", () => {
    render(<VerificationBadge verificationStatus="verified" lastVerifiedAt={new Date().toISOString()} />);
    expect(screen.getByText("Verified by Code Club")).toBeInTheDocument();
  });

  it("shows 'Not yet verified' for an unverified opportunity — never claims verification it doesn't have", () => {
    render(<VerificationBadge verificationStatus="unverified" />);
    expect(screen.getByText("Not yet verified")).toBeInTheDocument();
    expect(screen.queryByText("Verified by Code Club")).not.toBeInTheDocument();
  });

  it("never renders absolute/guarantee language regardless of status", () => {
    const { container: verifiedContainer } = render(
      <VerificationBadge verificationStatus="verified" lastVerifiedAt={new Date().toISOString()} />
    );
    const { container: unverifiedContainer } = render(<VerificationBadge verificationStatus="unverified" />);

    for (const html of [verifiedContainer.innerHTML, unverifiedContainer.innerHTML]) {
      expect(html.toLowerCase()).not.toMatch(/100%|guarantee|genuine/);
    }
  });

  it("compact mode shows the short 'Verified'/'Unverified' label", () => {
    render(<VerificationBadge verificationStatus="verified" compact />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});
