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
  opponentInfo: null, // 새로 추가된 상태
  roomInfo:null,
  isLoadingImages: false,
  setIsLoadingImages: (isLoading) => set({ isLoadingImages: isLoading }),

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
  },

  // 새로 추가된 액션
  setOpponentInfo: (info) => {
    set({ opponentInfo: info })
  },

  setRoomInfo: (info) => {
    set({ roomInfo: info })
  }
}));

export default useGameStore;
