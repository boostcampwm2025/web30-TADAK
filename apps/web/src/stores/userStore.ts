import { create } from 'zustand';

import { getUserProfile, type UserProfile } from '@/apis/user';

interface UserStore {
  user: UserProfile | null;
  isLoading: boolean;
  isLeavingRoom: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
  clearCurrentRoomId: () => void;
  setIsLeavingRoom: (val: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: false,
  isLeavingRoom: false,
  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getUserProfile();
      // 서버에서 방 정보가 지워진 것이 확인되면 이탈 중 플래그 해제
      if (user.currentRoomId === null) {
        set({ user, isLeavingRoom: false });
      } else {
        set({ user });
      }
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
  setIsLeavingRoom: (val) => set({ isLeavingRoom: val }),
}));
