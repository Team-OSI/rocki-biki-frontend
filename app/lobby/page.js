'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Room from '@/components/lobby/Room';
import RoomButton from '@/components/lobby/RoomButton';
import RoomModal from '@/components/lobby/RoomModal';

export default function App() {
  const router = useRouter();
  const [login, setLogin] = useState(false);
  const [rooms, setRooms] = useState([
    { title: '너만오면 고', participants: '1/2 byongjun', status: '참가하기' },
    { title: '나랑 싸울래...', participants: '2/2 태욱짱짱맨 vs 수미니미니', status: '경기중' },
    { title: '초보만 ㅋㅋ', participants: '1/2 tmdgh', status: '참가하기' },
  ]);
  const [showRoomModal, setShowRoomModal] = useState(false);

  const addRoom = (newRoom) => {
    setRooms([...rooms, newRoom]);
  };

  const goGame = (participants) => {
    router.push('/wait');
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/img/ring.jpg')" }}>
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
                participants={room.participants} 
                status={room.status} 
                onClick={() => goGame(room.participants)} 
              />
            ))}
          </div>
          <RoomButton onClick={() => setShowRoomModal(true)} />
        </div>
      </div>
      {showRoomModal && (
        <RoomModal
          onClose={() => setShowRoomModal(false)}
          onCreate={addRoom}
        />
      )}
    </div>
  );
}
