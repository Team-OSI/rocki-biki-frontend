'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';
import useSocket from '../../hooks/useSocket';

export default function Lobby() {
  const router = useRouter();
  // const { rooms, addRoom, joinRoom } = useSocket('http://localhost:7777');
  const { rooms, addRoom, joinRoom } = useSocket('//rocki-biki.com:4000');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);

  useEffect(() => {
    setFilteredRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    filterRooms();
  }, [rooms, searchTerm]);

  const goGame = (roomId) => {
    joinRoom(roomId);
    router.push(`/game?roomId=${roomId}`);
  };

  const handleCreateRoom = (roomData) => {
    addRoom(roomData, (newRoom) => {
      goGame(newRoom.roomId);
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filterRooms = () => {
    const filtered = rooms.filter(room => 
      room.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/img/ring.jpg')" }}>
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
            {filteredRooms.map((room, index) => (
              <Room 
                key={index} 
                title={room.title} 
                participants={`${room.participants}/2`} 
                status={room.status || '참가하기'} 
                onClick={() => goGame(room.roomId)} 
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