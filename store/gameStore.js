import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  opponentHealth: 100,
  playerHealth: 100,
  opponentReadyState: false,
  gameStatus: 'waiting', // 'waiting', 'bothReady' ,'playing', 'skillTime' ,'finished', 'replaying'
  winner: null,
  
  setGameStatus: (status) => set({ gameStatus: status }),

  decreaseOpponentHealth: (amount) => {
    set((state) => {
      const newHealth = Math.max(0, state.opponentHealth - amount);
      if (newHealth === 0) {
        return { opponentHealth: newHealth, gameStatus: 'finished', winner: 'player' };
      }
      return { opponentHealth: newHealth };
    });
  },
  decreasePlayerHealth: (amount) => {
    set((state) => {
      const newHealth = Math.max(0, state.playerHealth - amount);
      if (newHealth === 0) {
        return { playerHealth: newHealth, gameStatus: 'finished', winner: 'opponent' };
      }
      return { playerHealth: newHealth };
    });
  },

  resetGame: () => set({
    opponentHealth: 100,
    playerHealth: 100,
    gameStatus: 'idle',
    winner: null
  }),

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
  },
  handleDamage: (amount, socketId) => set((state) => {
    if (state.gameStatus === "playing" && state.socket.id !== socketId) {
      const newHealth = Math.max(0, state.playerHealth - amount);
      console.log('Damage applied:', amount);
      return { playerHealth: newHealth };
    }
    return state;
  }),
}));

export default useGameStore;