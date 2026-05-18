import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonModal } from "@/components/LessonModal";
import type { RawLesson } from "@/data/types";

const LESSON: RawLesson = {
  id: "multiply-decimals",
  title: "כפל שברים עשרוניים",
  topic: "decimal-fractions",
  body: "## איך עושים זאת?\n1. one\n\n## דוגמה\ntext\n\n## לשים לב\nwatch out\n",
};

describe("LessonModal", () => {
  it("renders the lesson title when open", () => {
    render(<LessonModal open lesson={LESSON} onClose={() => {}} />);
    expect(screen.getByText("כפל שברים עשרוניים")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<LessonModal open={false} lesson={LESSON} onClose={() => {}} />);
    expect(screen.queryByText("כפל שברים עשרוניים")).toBeNull();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("סגירה"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    const overlay = document.querySelector("[data-lesson-overlay]");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
