import { create } from 'zustand';

import { getUserProfile, type UserProfile } from '@/apis/user';

interface UserStore {
  user: UserProfile | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
  clearCurrentRoomId: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getUserProfile();
      set({ user });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
  clearUser: () => set({ user: null }),
  clearCurrentRoomId: () =>
    set((state) => ({
      user: state.user ? { ...state.user, currentRoomId: null } : null,
    })),
}));
