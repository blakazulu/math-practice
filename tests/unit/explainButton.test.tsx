import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplainButton } from "@/components/ExplainButton";

describe("ExplainButton", () => {
  it("renders the 'איך פותרים?' label", () => {
    render(<ExplainButton onClick={() => {}} pulse={false} />);
    expect(screen.getByText("איך פותרים?")).toBeInTheDocument();
  });

  it("calls onClick when tapped", () => {
    const onClick = vi.fn();
    render(<ExplainButton onClick={onClick} pulse={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies a pulse data-attr when pulse=true", () => {
    render(<ExplainButton onClick={() => {}} pulse={true} />);
    expect(screen.getByRole("button").getAttribute("data-pulse")).toBe("true");
  });
});
