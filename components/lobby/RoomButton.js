// components/lobby/RoomButton.js
import React from 'react';

export default function RoomButton({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="py-3 px-6 bg-secondary text-white font-bold rounded-md shadow-md hover:bg-secondary-dark transition duration-300 mt-4"
    >
      방 생성
    </button>
  );
}
