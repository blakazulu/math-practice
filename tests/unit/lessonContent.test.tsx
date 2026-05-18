import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonContent } from "@/components/LessonContent";

describe("LessonContent", () => {
  it("renders three H2 sections as section-label headers", () => {
    const body =
      "## איך עושים זאת?\ntext\n\n## דוגמה\ntext\n\n## לשים לב\ntext\n";
    render(<LessonContent body={body} />);
    expect(screen.getByText("איך עושים זאת?")).toBeInTheDocument();
    expect(screen.getByText("דוגמה")).toBeInTheDocument();
    expect(screen.getByText("לשים לב")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    const body =
      "## איך עושים זאת?\n1. first\n2. second\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(ol?.querySelectorAll("li").length).toBe(2);
  });

  it("renders an unordered list", () => {
    const body =
      "## איך עושים זאת?\n.\n\n## דוגמה\n- a\n- b\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul?.querySelectorAll("li").length).toBe(2);
  });

  it("renders inline math via react-katex InlineMath", () => {
    const body =
      "## איך עושים זאת?\nresult is $4 \\times 7 = 28$ done.\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("renders display math via react-katex BlockMath", () => {
    const body =
      "## איך עושים זאת?\n$$0.4 \\times 0.7 = 0.28$$\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });
});
