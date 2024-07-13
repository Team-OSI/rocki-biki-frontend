import {create} from 'zustand';
import io from 'socket.io-client';

const useSocketStore = create((set, get) => ({
    socket: null,
    rooms: [],

    initSocket: (url, userId) => {
        const newSocket = io(url);

        newSocket.on('connect', () => {
            newSocket.emit('USER_CONNECT', userId); 
          });

        newSocket.on('ROOMS_UPDATE', (rooms) => {
            console.log('ROOMS_UPDATE received', rooms);
            set({ rooms });
        })
        set({ socket: newSocket});

    },

    closeSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null });
        }
    },

    addRoom: (room, callback) => {
        const { socket } = get();
        if (socket) {
            socket.emit('ADD_ROOM', room, (newRoom) => {
                if (callback) callback(newRoom);
            });
        }
    },

    joinRoom: (roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('join room', roomId);
        }
    },

    emitOffer: (offer, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('offer', { type: offer.type, sdp: offer.sdp, roomId });
        }
    },

    emitAnswer: (answer, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('answer', { type: answer.type, sdp: answer.sdp, roomId });
        }
    },

    emitCandidate: (candidate, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('candidate', { candidate, roomId });
        }
    },
}));

export default useSocketStore;
