import { create } from 'zustand';

const useUserStore = create((set, get) => ({
  socketId: null,
  nickname: '',
  
  setSocketId: (id) => {
    set({ socketId: id });
    console.log('socketId:', id);
  },
  
  setMyNickname: (name) => {
    set({ nickname: name });
    console.log('nickname:', name);
  },

  resetUser: () => {
    set({ socketId: null, nickname: '' });
    console.log('reset user: socketId and nickname reset to null and empty string');
  }
}));

export default useUserStore;
