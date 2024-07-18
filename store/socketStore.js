import {create} from 'zustand';
import io from 'socket.io-client';
import useGameStore from './gameStore';

const useSocketStore = create((set, get) => ({
    socket: null,
    lastEmittedPlayerRead: null, // 마지막으로 보낸 플레이어의 준비 상태를 저장
    rooms: [],
    opponentSkill: null,

    initSocket: (url, userId) => {
        const newSocket = io(url);
        
        const existingSocket = get().socket;
        if (existingSocket) {
            existingSocket.close();
            set({ socket: null });
        }

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
            // setTimeout(() => set({ opponentSkill: null }), 5000);
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
            console.log(offer, roomId)
            socket.emit('offer', { type: offer.type, sdp: offer.sdp, roomId });
        }
    },

    emitAnswer: (answer, roomId) => {
        const { socket } = get();
        if (socket) {
            console.log(answer, roomId)
            socket.emit('answer', { type: answer.type, sdp: answer.sdp, roomId });
        }
    },

    emitCandidate: (candidate, roomId) => {
        const { socket } = get();
        if (socket) {
            console.log(candidate, roomId)
            socket.emit('candidate', { candidate, roomId });
        }
    },

    // useSkill: () => (skillType) => {
    //     const { socket } = get();
    //     if (socket) {
    //         socket.emit('castSkill', { skillType, timeStamp: Date.now() });
    //     }
    // },
    
    useSkill: () => (skillType, roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('castSkill', { skillType, roomId, timeStamp: Date.now() });
        }
    },

    // 데미지 보내기
    emitDamage: (damage) => {
        const { socket } = get();
        if (socket) {
            socket.emit('attackDamage', { amount: damage });
        }
    },

    // 플레이어 상태 보내기
    emitPlayerReady: (state) => {
        const { socket, lastEmittedPlayerReady } = get();
        if (socket) {
            // 마지막으로 보낸 상태와 현재 상태가 다를 때만 emit
            if(lastEmittedPlayerReady === null || lastEmittedPlayerReady !== state){
                socket.emit('ready', { state: state });
                set({ lastEmittedPlayerReady: state}) // 마지막 상태 업데이트
            }
        }
    },
    // 게임 시작하기
    emitGameStart: () => {
        const { socket } = get();
        if (socket) {
            socket.emit('start')
        }
    },
    // Map을 사용하는 새로운 유틸리티 메서드들
    getRoomById: (roomId) => {
        return get().rooms.get(roomId);
    },

    getAllRooms: () => {
        return Array.from(get().rooms.values());
    },

    updateRoom: (roomId, updateFn) => {
        set(state => {
            const newRooms = new Map(state.rooms);
            const room = newRooms.get(roomId);
            if (room) {
                newRooms.set(roomId, updateFn(room));
            }
            return { rooms: newRooms };
        });
    },

    removeRoom: (roomId) => {
        set(state => {
            const newRooms = new Map(state.rooms);
            newRooms.delete(roomId);
            return { rooms: newRooms };
        });
    }
}));

export default useSocketStore;