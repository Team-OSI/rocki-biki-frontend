'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';
import useSocket from '../../hooks/useSocket';

export default function Lobby() {
  const router = useRouter();
  const { rooms, addRoom, joinRoom } = useSocket('http://localhost:7777');
  const [showRoomModal, setShowRoomModal] = useState(false);

  useEffect(() => {
    console.log('Rooms updated', rooms); 
  }, [rooms]);

  const goGame = (roomId) => {
    joinRoom(roomId);
    router.push(`/game?roomId=${roomId}`);
  };

  const handleCreateRoom = (roomData) => {
    addRoom(roomData, (newRoom) => {
      goGame(newRoom.roomId);
    });
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/ring.jpg')" }}>
      <div className="absolute top-16 w-full flex flex-col items-center gap-4 font-bold">
        <h1 className="text-8xl">로비</h1>
      </div>
      <div className="flex flex-col items-center w-full max-w-screen-md mt-60 mb-30">
        <div className="w-full p-6 bg-blue-100 rounded-lg shadow-lg">
          <div className="flex justify-between mb-6">
            <button className="bg-gray-300 px-4 py-2 rounded-lg">필터</button>
            <input className="border border-gray-300 p-2 rounded-lg flex-grow mx-4" placeholder="검색창" />
            <button className="bg-gray-300 px-4 py-2 rounded-lg">검색</button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {rooms.map((room, index) => (
              <Room 
                key={index} 
                title={room.title} 
                participants={`${room.participants}/2`} 
                status={room.status || '참가하기'} 
                onClick={() => goGame(room.roomId)} 
              />
            ))}
          </div>
          <RoomButton onClick={() => setShowRoomModal(true)} />
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
