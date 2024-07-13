import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  opponentHealth: 100,
  playerHealth: 100,
  opponentReadyState: false,
  gameStatus: 'idle', // 'idle', 'ready' ,'playing', 'finished', 'replaying'
  decreaseOpponentHealth: (amount) => set((state) => ({ 
    opponentHealth: Math.max(0, state.opponentHealth - amount)
  })),
  
  setGameStatus: (status) => set({ gameStatus: status }),

  decreasePlayerHealth: (amount) => set((state) => ({ 
    playerHealth: Math.max(0, state.playerHealth - amount)
  })),

  startGame: () => set({
    opponentHealth: 100,
    playerHealth: 100,
    gameStatus: 'playing'
  }),

  setOpponentReady: (state) => {
    const currentState = get().opponentReadyState;
    if (currentState !== state){
      console.log('update setOpponentReady')
      set({opponentReadyState: state})
    }
  }
}));

export default useGameStore;