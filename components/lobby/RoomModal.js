// components/lobby/RoomModal.js
import React, { useState } from 'react';

export default function RoomModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('1/2');
  
  const handleCreate = () => {
    onCreate({ title, participants, status: '참가하기' });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">방 만들기</h2>
        <input
          type="text"
          placeholder="방 제목"
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="w-full bg-secondary text-white py-2 rounded-md hover:bg-secondary-dark transition duration-300"
        >
          만들기
        </button>
        <button
          onClick={onClose}
          className="w-full mt-4 text-black-600 hover:underline"
        >
          취소
        </button>
      </div>
    </div>
  );
}
