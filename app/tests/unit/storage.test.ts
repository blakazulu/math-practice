import { describe, it, expect, beforeEach } from "vitest";
import { readPersist, writePersist, clearPersist, STORAGE_KEY } from "@/lib/storage";
import type { PersistRoot } from "@/data/types";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("readPersist returns null when nothing stored", () => {
    expect(readPersist()).toBeNull();
  });

  it("readPersist returns parsed object when valid JSON present", () => {
    const data: PersistRoot = { version: 1, activeUserId: null, users: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(readPersist()).toEqual(data);
  });

  it("readPersist returns null on invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readPersist()).toBeNull();
  });

  it("writePersist round-trips", () => {
    const data: PersistRoot = { version: 1, activeUserId: "noa", users: {} };
    writePersist(data);
    expect(readPersist()).toEqual(data);
  });

  it("clearPersist removes the key", () => {
    writePersist({ version: 1, activeUserId: null, users: {} });
    clearPersist();
    expect(readPersist()).toBeNull();
  });
});
