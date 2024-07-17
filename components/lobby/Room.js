import React from 'react';

export default function Room({ title, player1, player2, status,  onClick }) {
  const isFull = status;
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md mb-4">
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-gray-600">{player1}</p>
        <p className="text-sm text-gray-600">{player2}</p>
      </div>
      <button 
        onClick={onClick} 
        className={`py-2 px-4 rounded-md ${status ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-light transition duration-300'}`}
        disabled={isFull}
      >
        {isFull ? '경기중' : '참가하기'}
      </button>
    </div>
  );
}
