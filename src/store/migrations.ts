import type { PersistRoot, UserState } from "@/data/types";

function backfillUser(u: UserState): UserState {
  if (u.progress.stats.dailyAnswered) return u;
  return {
    ...u,
    progress: {
      ...u.progress,
      stats: { ...u.progress.stats, dailyAnswered: {} },
    },
  };
}

export function migrate(input: unknown): PersistRoot {
  if (input == null || typeof input !== "object") {
    return { version: 1, activeUserId: null, users: {} };
  }
  const obj = input as { version?: unknown };
  if (typeof obj.version !== "number") {
    return { version: 1, activeUserId: null, users: {} };
  }
  if (obj.version === 1) {
    const root = input as PersistRoot;
    const users: Record<string, UserState> = {};
    for (const [id, u] of Object.entries(root.users)) {
      users[id] = backfillUser(u);
    }
    return { ...root, users };
  }
  if (obj.version > 1) {
    throw new Error(`Unknown persist version: ${obj.version}. Refusing to clobber.`);
  }
  return { version: 1, activeUserId: null, users: {} };
}
