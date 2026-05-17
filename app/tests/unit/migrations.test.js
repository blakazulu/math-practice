import { describe, it, expect } from "vitest";
import { migrate } from "@/store/migrations";
describe("migrations", () => {
    it("returns empty root when input is null", () => {
        const out = migrate(null);
        expect(out.version).toBe(1);
        expect(out.activeUserId).toBeNull();
        expect(out.users).toEqual({});
    });
    it("passes v1 data through unchanged", () => {
        const v1 = { version: 1, activeUserId: "noa", users: {} };
        expect(migrate(v1)).toEqual(v1);
    });
    it("throws on unknown future version", () => {
        expect(() => migrate({ version: 99 })).toThrow(/Unknown.*version/i);
    });
    it("rebuilds when payload is unrecognizable", () => {
        const out = migrate({ randomJunk: true });
        expect(out.version).toBe(1);
        expect(out.users).toEqual({});
    });
});
