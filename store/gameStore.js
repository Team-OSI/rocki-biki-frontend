import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  myReady: false,
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
  
  setMyReady: (state) => {
    set({ myReady: state })
  }
}));

export default useGameStore;