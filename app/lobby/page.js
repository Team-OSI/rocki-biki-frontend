'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';
import useSocketStore from '@/store/socketStore';
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";

export default function Lobby() {
  const router = useRouter();
  const { initSocket, closeSocket, rooms, addRoom, joinRoom } = useSocketStore();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);


  useEffect(() => {
    initSocket(process.env.NEXT_PUBLIC_NODE_SERVER || 'http://localhost:7777');
    return () => closeSocket;
  },[initSocket, closeSocket]);

  useEffect(() => {
    console.log(rooms)
  }, [rooms]);


  // useEffect(() => {
  //   filterRooms();
  // }, [rooms, searchTerm]);

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

  // const filterRooms = () => {
  //   const filtered = Object.entries(rooms).filter(([roomId, room])=> 
  //     room.title.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  //   setFilteredRooms(filtered);
  // };


  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/ring.jpg')" }}>
      <div className="absolute top-12 w-full flex flex-col items-center gap-4 font-bold">
        <h1 className="text-8xl">로비</h1>
      </div>
      <div className="flex flex-col items-center w-full max-w-screen-md mt-40 mb-40">
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
          {Array.from(rooms).map(([roomId, room]) => (
            <Room 
              key={roomId}
              title={room.title}
              participants={`${room.players.length}/2`}
              status={room.players.length < 2 ? '참가하기' : '경기중'}
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
    </div>
  );
}