import { describe, it, expect } from "vitest";
import { seededShuffle } from "@/lib/shuffle";
describe("seededShuffle", () => {
    it("returns the same items, just reordered", () => {
        const input = [1, 2, 3, 4, 5];
        const result = seededShuffle(input, 42);
        expect(result.slice().sort()).toEqual([1, 2, 3, 4, 5]);
    });
    it("is deterministic for a given seed", () => {
        const a = seededShuffle(["a", "b", "c", "d", "e"], 99);
        const b = seededShuffle(["a", "b", "c", "d", "e"], 99);
        expect(a).toEqual(b);
    });
    it("different seeds produce different orderings", () => {
        const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1);
        const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
        expect(a).not.toEqual(b);
    });
    it("does not mutate input", () => {
        const input = [1, 2, 3];
        seededShuffle(input, 1);
        expect(input).toEqual([1, 2, 3]);
    });
    it("handles empty array", () => {
        expect(seededShuffle([], 1)).toEqual([]);
    });
});
