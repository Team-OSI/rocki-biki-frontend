'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';
import NicknameModal from '@/components/lobby/NicknameModal';
import useSocketStore from '@/store/socketStore';
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import useUserStore from '@/store/userStore';
import { useTitle } from "@/app/contexts/TitleContext";

export default function Lobby() {
  const router = useRouter();
  const { initSocket, closeSocket, rooms, addRoom, joinRoom } = useSocketStore();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const { setSocketId, setMyNickname } = useUserStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [userNickname, setUserNickname] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('')
  const { setTitle } = useTitle();

  useEffect(() => {
    // const token = Cookies.get('JWT_TOKEN');
    // const decoded = jwtDecode(token);
    // console.log(decoded.sub);
    const socket = initSocket(process.env.NEXT_PUBLIC_NODE_SERVER || 'http://localhost:7777');

    socket.on('connect', () => {
      setSocketId(socket.id);
      setUserNickname('123');
    });
    return () => closeSocket;
  },[initSocket, closeSocket]);

  useEffect(() => {
    setTitle("Lobby")
  }, [setTitle]);

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
      setUserNickname(nickname);
      setShowNicknameModal(false);
    } catch (err) {
      alert('Failed to set nickname');
    }
  };

  return (
      <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/ring.jpg')" }}>
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