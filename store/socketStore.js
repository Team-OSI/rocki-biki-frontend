import {create} from 'zustand';
import io from 'socket.io-client';

const useSocketStore = create((set, get) => ({
    socket: null,
    lastEmittedPlayerReady: null, // 마지막으로 보낸 플레이어의 준비 상태를 저장
    rooms: new Map(),
    opponentSkill: null,

    initSocket: (url, onRoomClosed) => {
        let newSocket;

        newSocket = io(url, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            forceNew: false,
          });

        newSocket.on('ROOMS_UPDATE', (roomsData) => {
            // 서버에서 받은 데이터를 Map으로 변환
            const roomsMap = new Map(Object.entries(roomsData))
            console.log('ROOMS_UPDATE received', roomsMap);
            set({ rooms: roomsMap });
        })

        newSocket.on('ROOM_CLOSE', () => {
            if (onRoomClosed) onRoomClosed();
            alert('The room owner has left. Redirecting to the lobby.');
          });

        set({ socket : newSocket })
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
                // 새 방을 받으면 rooms Map에 추가
                if (callback) callback(newRoom);
            });
        }
    },

    joinRoom: (roomId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('join room', roomId);
            // 방 참여 후 해당 방의 정보 업데이트
            // set(state => {
            //     const newRooms = new Map(state.rooms);
            //     const room = newRooms.get(roomId);
            //     if (room) {
            //         newRooms.set(roomId, room);
            //     }
            //     return { rooms: newRooms }
            // })
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

    useSkill: () => (skillType) => {
        const { socket } = get();
        if (socket) {
            socket.emit('castSkill', { skillType, timeStamp: Date.now() });
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