import { create } from 'zustand';

const useGameStore = create((set) => ({
  opponentHealth: 100,
  playerHealth: 100,
  decreaseOpponentHealth: (amount) => set((state) => ({ 
    opponentHealth: Math.max(0, state.opponentHealth - amount)
  })),
  decreasePlayerHealth: (amount) => set((state) => ({ 
    playerHealth: Math.max(0, state.playerHealth - amount)
  })),
}));

export default useGameStore;