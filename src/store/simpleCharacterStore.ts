// /Users/montysharma/V11M2/src/store/simpleCharacterStore.ts
import { create } from 'zustand';

interface SimpleCharacterStore {
  count: number;
  increment: () => void;
}

export const useSimpleCharacterStore = create<SimpleCharacterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));