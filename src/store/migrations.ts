import type { PersistRoot } from "@/data/types";

export function migrate(input: unknown): PersistRoot {
  if (input == null || typeof input !== "object") {
    return { version: 1, activeUserId: null, users: {} };
  }
  const obj = input as { version?: unknown };
  if (typeof obj.version !== "number") {
    return { version: 1, activeUserId: null, users: {} };
  }
  if (obj.version === 1) {
    return input as PersistRoot;
  }
  if (obj.version > 1) {
    throw new Error(`Unknown persist version: ${obj.version}. Refusing to clobber.`);
  }
  return { version: 1, activeUserId: null, users: {} };
}
