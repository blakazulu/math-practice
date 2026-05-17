import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CountUp } from "@/components/CountUp";

describe("CountUp", () => {
  it("renders the value", () => {
    render(<CountUp value={42} />);
    expect(screen.getByText(/^\d+$/)).toBeInTheDocument();
  });

  it("renders zero", () => {
    render(<CountUp value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
