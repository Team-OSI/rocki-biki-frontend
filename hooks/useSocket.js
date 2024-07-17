// import { useEffect, useState } from 'react';
// import io from 'socket.io-client';

// const useSocket = (url) => {
//   const [socket, setSocket] = useState(null);
//   const [rooms, setRooms] = useState([]);

//   useEffect(() => {
//     const newSocket = io(url);
//     setSocket(newSocket);

//     newSocket.on('ROOMS_UPDATE', (rooms) => {
//       console.log('ROOMS_UPDATE received', rooms); // 디버그 로그 추가
//       setRooms(rooms);
//     });

//     return () => {
//       newSocket.close();
//     };
//   }, [url]);

//   const addRoom = (room, callback) => {
//     if (socket) {
//       socket.emit('ADD_ROOM', room, (newRoom) => {
//         if (callback) callback(newRoom);
//       });
//     }
//   };

//   const joinRoom = (roomId) => {
//     if (socket) {
//       socket.emit('join room', roomId);
//     }
//   };

//   return { socket, rooms, addRoom, joinRoom };
// };

// export default useSocket;