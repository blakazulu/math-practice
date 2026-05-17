import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createUsersSlice } from "@/store/usersSlice";
function makeStore() {
    return create()((...a) => createUsersSlice(...a));
}
describe("usersSlice", () => {
    beforeEach(() => localStorage.clear());
    it("creates a user with a slug id", () => {
        const store = makeStore();
        const id = store.getState().createUser("נועה");
        expect(id).toBe("נועה");
        expect(store.getState().users[id].name).toBe("נועה");
        expect(store.getState().activeUserId).toBe(id);
    });
    it("dedupes ids on conflict", () => {
        const store = makeStore();
        const a = store.getState().createUser("נועה");
        const b = store.getState().createUser("נועה");
        expect(a).toBe("נועה");
        expect(b).toBe("נועה-2");
    });
    it("switchUser sets activeUserId", () => {
        const store = makeStore();
        const a = store.getState().createUser("נועה");
        const b = store.getState().createUser("יעל");
        store.getState().switchUser(a);
        expect(store.getState().activeUserId).toBe(a);
        store.getState().switchUser(b);
        expect(store.getState().activeUserId).toBe(b);
    });
    it("deleteUser removes from users map and clears active if needed", () => {
        const store = makeStore();
        const a = store.getState().createUser("נועה");
        store.getState().deleteUser(a);
        expect(store.getState().users[a]).toBeUndefined();
        expect(store.getState().activeUserId).toBeNull();
    });
    it("resetUserProgress wipes progress for the given user", () => {
        const store = makeStore();
        const a = store.getState().createUser("נועה");
        store.setState((s) => {
            s.users[a].progress.stats.totalAnswered = 5;
            return s;
        });
        store.getState().resetUserProgress(a);
        expect(store.getState().users[a].progress.stats.totalAnswered).toBe(0);
    });
});
