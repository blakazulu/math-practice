import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionGrid } from "@/components/OptionGrid";
const q = {
    id: "test/q/1",
    number: 1,
    question: "מה תוצאת 1+1?",
    options: { א: "1", ב: "2", ג: "3", ד: "4" },
    correct_answer: "2",
    correct_letter: "ב",
    explanation: "",
    flags: [],
};
describe("OptionGrid", () => {
    it("renders all four options", () => {
        render(_jsx(OptionGrid, { question: q }));
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
    });
    it("calls onPick with the chosen letter", () => {
        const onPick = vi.fn();
        render(_jsx(OptionGrid, { question: q, onPick: onPick }));
        fireEvent.click(screen.getByText("2").closest("button"));
        expect(onPick).toHaveBeenCalledWith("ב");
    });
    it("disables interactions when revealed=true", () => {
        const onPick = vi.fn();
        render(_jsx(OptionGrid, { question: q, onPick: onPick, revealed: true }));
        fireEvent.click(screen.getByText("2").closest("button"));
        expect(onPick).not.toHaveBeenCalled();
    });
});
