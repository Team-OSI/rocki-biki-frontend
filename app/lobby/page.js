'use client'

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';
import NicknameModal from '@/components/lobby/NicknameModal';
import Navbar from '@/components/lobby/Navbar';
import useSocketStore from '@/store/socketStore';
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import useUserStore from '@/store/userStore';
import {getNickname, getUserEmail} from '@/api/user/api';

export default function Lobby() {
  const router = useRouter();
  const { initSocket, closeSocket, rooms, addRoom, joinRoom } = useSocketStore();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const { setSocketId, setNickname } = useUserStore();
  const [userEmail, setUserEmail] = useState([]);
  const [nickname, setNickname] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false); 
  const [userNickname, setUserNickname] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('')

  useEffect(() => {
    const initializeUser = async () => {
      const email = await getUserEmail();
      setUserEmail(email);

      if (email) {
        try {
          const response = await getNickname(email);
          setUserProfileImage(response.profileImage);
          setUserNickname(response.nickname);
        } catch (err) {
          console.error("Error fetching user data:", err);
          setShowNicknameModal(true);
        }
      } else {
        console.error("No user email found");
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    // const token = Cookies.get('JWT_TOKEN');
    // const decoded = jwtDecode(token);
    // console.log(decoded.sub);
    const socket = initSocket(process.env.NEXT_PUBLIC_NODE_SERVER || 'http://localhost:7777');

    socket.on('connect', () => {
      setSocketId(socket.id);
      setNickname('123');
    });
    return () => closeSocket;
  },[initSocket, closeSocket]);

  // useEffect(() => {
    // const token = Cookies.get('JWT_TOKEN');
  //   if (token) {
  //     try {
  //       const decoded = jwtDecode(token);
  //       setNickname(decoded.sub);
  //       initSocket(process.env.NEXT_PUBLIC_NODE_SERVER, decoded.sub);
  //     } catch (error) {
  //       console.error('Failed to decode JWT token:', error);
  //     }
  //   }
  //   return () => closeSocket();
  // }, [initSocket, closeSocket])

  useEffect(() => {
    console.log(rooms);
    filterRooms();
  }, [rooms, searchTerm]);

  const goGame = (roomId) => {
    joinRoom(roomId);
    router.push(`/game?roomId=${roomId}`);
  };

  const handleCreateRoom = (roomData) => {
    addRoom(roomData, (newRoom) => {
      goGame(newRoom);
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filterRooms = () => {
    const filtered = Object.entries(rooms).filter(([roomId, room]) =>
      room.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  };

  const handleNicknameSubmit = async (nickname) => {
    try {
      await setNickname(nickname);
      setUserNickname(nickname); 
      setShowNicknameModal(false);
    } catch (err) {
      alert('Failed to set nickname');
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/ring.jpg')" }}>
      <Navbar userEmail={userEmail} userNickname={userNickname} userProfileImage={userProfileImage} />
      <div className="mt-32 flex flex-col items-center w-full max-w-screen-md">
        <div className="w-full p-6 bg-blue-100 rounded-lg shadow-lg">
          <div className="flex justify-center items-center mb-6">
            <input
              className="border border-gray-300 py-2 px-2 rounded-lg max-w-xs w-1/2 h-12"
              placeholder="방 제목"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="ml-8 h-20">
              <RoomButton onClick={() => setShowRoomModal(true)} />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredRooms.map(([roomId, room]) => (
              <Room 
                key={roomId}
                title={room.title}
                player1={room.players[0]}
                player2={room.players[1]}
                status={room.players.length < 2 ? false : true}
                onClick={() => goGame(roomId)}

              />
            ))}
          </div>
        </div>
      </div>
      {showRoomModal && (
        <RoomModal
          onClose={() => setShowRoomModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
      {showNicknameModal && (
        <NicknameModal
          onClose={() => setShowNicknameModal(false)}
          onSubmit={handleNicknameSubmit}
        />
      )}
    </div>
  );
}
