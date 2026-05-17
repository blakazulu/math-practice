import { describe, it, expect } from "vitest";
import { slugifyName, makeUniqueUserId } from "@/lib/slug";
describe("slug helpers", () => {
    it("slugifyName lowercases and trims", () => {
        expect(slugifyName("  Noa  ")).toBe("noa");
    });
    it("slugifyName preserves Hebrew letters", () => {
        expect(slugifyName("נועה")).toBe("נועה");
    });
    it("slugifyName replaces internal whitespace with single hyphen", () => {
        expect(slugifyName("נועה   כהן")).toBe("נועה-כהן");
    });
    it("slugifyName strips punctuation and emoji", () => {
        expect(slugifyName("Noa! :)")).toBe("noa");
        expect(slugifyName("נועה ⭐")).toBe("נועה");
    });
    it("slugifyName falls back when input is empty after stripping", () => {
        expect(slugifyName("!!!")).toBe("user");
        expect(slugifyName("")).toBe("user");
    });
    it("makeUniqueUserId returns the base id when free", () => {
        expect(makeUniqueUserId("noa", new Set())).toBe("noa");
    });
    it("makeUniqueUserId suffixes on collision", () => {
        const taken = new Set(["noa", "noa-2"]);
        expect(makeUniqueUserId("noa", taken)).toBe("noa-3");
    });
});
