import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  opponentHealth: 100,
  playerHealth: 100,
  opponentReadyState: false,
  gameStatus: 'waiting', // 'waiting', 'bothReady' ,'playing', 'skillTime' ,'finished', 'replaying'
  winner: null,
  playerSkills: [null, null],
  opponentSkills: [null, null],
  
  setGameStatus: (status, socketId) => {
    const playerIds = Object.keys(status.players);
    const opponentId = playerIds.find(id => id !== socketId);

    set(state => ({
      gameStatus: status.gameStatus,
      playerHealth: status.players[socketId].health,
      opponentHealth: status.players[opponentId].health,
      opponentReadyState: status.players[opponentId].ready,
      winner: status.winner,
      playerSkills: status.players[socketId].skill,
      opponentSkills: status.players[opponentId].skill
    }));
  },

  // decreaseOpponentHealth: (amount) => {
  //   set((state) => {
  //     const newHealth = Math.max(0, state.opponentHealth - amount);
  //     if (newHealth === 0) {
  //       return { opponentHealth: newHealth, gameStatus: 'finished', winner: 'player' };
  //     }
  //     return { opponentHealth: newHealth };
  //   });
  // },
  // decreasePlayerHealth: (amount) => {
  //   set((state) => {
  //     const newHealth = Math.max(0, state.playerHealth - amount);
  //     if (newHealth === 0) {
  //       return { playerHealth: newHealth, gameStatus: 'finished', winner: 'opponent' };
  //     }
  //     return { playerHealth: newHealth };
  //   });
  // },

  // resetGame: () => set({
  //   opponentHealth: 100,
  //   playerHealth: 100,
  //   gameStatus: 'idle',
  //   winner: null
  // }),

  // startGame: () => set({
  //   opponentHealth: 100,
  //   playerHealth: 100,
  //   gameStatus: 'playing'
  // }),

  // setOpponentReady: (state) => {
  //   const currentState = get().opponentReadyState;
  //   if (currentState !== state){
  //     console.log('update setOpponentReady')
  //     set({opponentReadyState: state})
  //   }
  // },
}));

export default useGameStore;