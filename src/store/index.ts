import { create } from "zustand";
import { createBankSlice, type BankSlice } from "./bankSlice";
import { createUsersSlice, type UsersSlice } from "./usersSlice";
import { createSessionSlice, type SessionSlice } from "./sessionSlice";

export type AppStore = BankSlice & UsersSlice & SessionSlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createBankSlice(...a),
  ...createUsersSlice(...a),
  ...createSessionSlice(...a),
}));

export const selectActiveUser = (s: AppStore) =>
  s.activeUserId ? s.users[s.activeUserId] : null;
export const selectReviewQueueSize = (s: AppStore) =>
  selectActiveUser(s)?.progress.reviewQueue.length ?? 0;
