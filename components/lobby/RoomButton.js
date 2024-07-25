// components/lobby/RoomButton.js
import React from 'react';

export default function RoomButton({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="py-3 w-full text-2xl bg-[#ed7716] text-white font-bold rounded-full shadow-md hover:scale-105 transition duration-300 mt-4"
    >
      CREATE
    </button>
  );
}
