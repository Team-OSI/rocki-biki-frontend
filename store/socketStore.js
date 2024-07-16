import {create} from 'zustand';
import io from 'socket.io-client';
import useGameStore from './gameStore';

const useSocketStore = create((set, get) => ({
    socket: null,
    lastEmittedPlayerRead: null, // 마지막으로 보낸 플레이어의 준비 상태를 저장
    rooms: [],
    opponentSkill: null,

    initSocket: (url) => {
        const newSocket = io(url);
        
        const existingSocket = get().socket;
        if (existingSocket) {
            existingSocket.close();
            set({ socket: null });
        }

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
        return newSocket;
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
    },

    // 데미지 보내기
    emitDamage: (damage, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('damage', { roomId: roomId.current, amount: damage });
        }
    },

    // 플레이어 상태 보내기
    emitPlayerReady: (state, roomId) => {
        const { socket, lastEmittedPlayerRead } = get();
        if (socket) {
            // 마지막으로 보낸 상태와 현재 상태가 다를 때만 emit
            if(lastEmittedPlayerRead === null || lastEmittedPlayerRead !== state){
                socket.emit('ready', {roomId: roomId, state: state});
                set({ lastEmittedPlayerRead: state}) // 마지막 상태 업데이트
            }
        }
    }
}));

export default useSocketStore;
