import {create} from 'zustand';
import io from 'socket.io-client';

const useSocketStore = create((set, get) => ({
    socket: null,
    rooms: [],
    opponentSkill: null,

    initSocket: (url, userId) => {
        const newSocket = io(url);

        newSocket.on('connect', () => {
            newSocket.emit('USER_CONNECT', userId); 
          });

        newSocket.on('ROOMS_UPDATE', (rooms) => {
            console.log('ROOMS_UPDATE received', rooms);
            set({ rooms });
        })

        newSocket.on('opponentSkillUsed', ({ skillType }) => {
            set({ opponentSkill: { skillType } });
            console.log("받은 데이터: ", skillType)
            setTimeout(() => set({ opponentSkill: null }), 5000);
        });
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

    useSkill: () => (skillType, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('useSkill', { roomId, skillType, timeStamp: Date.now() });
        }
    }
}));

export default useSocketStore;
