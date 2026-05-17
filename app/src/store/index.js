import { create } from "zustand";
import { createBankSlice } from "./bankSlice";
import { createUsersSlice } from "./usersSlice";
import { createSessionSlice } from "./sessionSlice";
export const useStore = create()((...a) => ({
    ...createBankSlice(...a),
    ...createUsersSlice(...a),
    ...createSessionSlice(...a),
}));
export const selectActiveUser = (s) => s.activeUserId ? s.users[s.activeUserId] : null;
export const selectReviewQueueSize = (s) => selectActiveUser(s)?.progress.reviewQueue.length ?? 0;
