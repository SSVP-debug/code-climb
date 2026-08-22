import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CompanyTagsNotice from "./CompanyTagsNotice";

describe("CompanyTagsNotice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the placeholder-data message by default", () => {
    render(<CompanyTagsNotice />);
    expect(screen.getByText(/placeholder test data for now/i)).toBeInTheDocument();
  });

  it("hides itself and remembers the dismissal in localStorage", () => {
    render(<CompanyTagsNotice />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByText(/placeholder test data for now/i)).not.toBeInTheDocument();
    expect(localStorage.getItem("codeclub_company_tags_notice_dismissed_v1")).toBe("true");
  });

  it("stays hidden on a later mount once previously dismissed", () => {
    localStorage.setItem("codeclub_company_tags_notice_dismissed_v1", "true");
    render(<CompanyTagsNotice />);
    expect(screen.queryByText(/placeholder test data for now/i)).not.toBeInTheDocument();
  });
});