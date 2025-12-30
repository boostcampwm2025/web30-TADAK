import type { UserRole } from '@shared/types/user';
import { create } from 'zustand';

export type Player = { roomId: string; role: UserRole; userId: string; username: string };
type CodeMap = Record<string, string>;

type State = {
  players: Player[];
  codes: CodeMap;
  me?: Player;
  setPlayers: (players: Player[]) => void;
  setMe: (me: Player) => void;
  upsertPlayer: (player: Player) => void;
  upsertCode: (userId: string, code: string) => void;
};

export const useRoomStore = create<State>((set) => ({
  players: [],
  codes: {},
  setPlayers: (players) => set({ players }),
  setMe: (me) => set({ me }),
  upsertPlayer: (player) =>
    set((state) => {
      const existingIndex = state.players.findIndex((p) => p.userId === player.userId);
      if (existingIndex === -1) return { players: [...state.players, player] };
      const next = [...state.players];
      next[existingIndex] = player;
      return { players: next };
    }),
  upsertCode: (userId, code) => set((s) => ({ codes: { ...s.codes, [userId]: code } })),
}));
