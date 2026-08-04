import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeScreen from "./WelcomeScreen";

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

describe("WelcomeScreen", () => {
  it("uses the spec-mandated CTA label, not Skip/Continue/Next", () => {
    render(<WelcomeScreen onStart={() => {}} />);

    expect(screen.getByText("Start Today's Session")).toBeInTheDocument();
    expect(screen.queryByText(/^skip$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^continue$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^next$/i)).not.toBeInTheDocument();
  });

  it("calls onStart when the CTA is clicked", () => {
    const onStart = vi.fn();
    render(<WelcomeScreen onStart={onStart} />);

    fireEvent.click(screen.getByText("Start Today's Session"));

    expect(onStart).toHaveBeenCalled();
  });
});