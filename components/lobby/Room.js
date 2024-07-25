import React from 'react';

export default function Room({ title, player1, player2, status,  onClick }) {
  const isFull = status;
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md mb-4">
        <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-lg font-bold">
                <span className="text-blue-600">{player1}</span>
                <span className="text-red-600 mx-2">VS</span>
                <span className="text-green-600">{player2}</span>
            </p>
        </div>
        <button
            onClick={onClick}
            className={`py-2 px-4 rounded-md ${status ? 'bg-gray-300 text-xl cursor-not-allowed' : 'bg-[#bd1439] text-xl text-white hover:bg-primary-light transition duration-300'}`}
        disabled={isFull}
      >
        {isFull ? '경기중' : '참가하기'}
      </button>
    </div>
  );
}
