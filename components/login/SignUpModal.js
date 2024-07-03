import React from 'react';

export default function SignupModal({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
        <h2 className="text-xl font-bold mb-6 text-dark">SIGN UP</h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="ID"
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="my-6 text-dark">or</p> {/* "or"의 상하 간격을 늘림 */}
        <div className="flex justify-center gap-4 w-full mb-6"> {/* 버튼 간격과 하단 여백을 늘림 */}
          <button className="flex-1 bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-700 transition duration-300">
            Kakao 
          </button>
          <button className="flex-1 bg-white text-black py-2 rounded-md hover:bg-gray-400 transition duration-300 border border-black">
            Google 
          </button>
          <button className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-800 transition duration-300">
            Naver 
          </button>
        </div>
        <button className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300">
          Sign Up
        </button>
      </div>
    </div>
  );
}
