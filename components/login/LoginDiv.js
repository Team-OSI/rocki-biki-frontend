// components/login/LoginDiv.js
import React, { useState } from 'react';
import SignupModal from './SignUpModal';

export default function LoginDiv({ onClose, onLogin }) {
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  return (
    <div className="relative flex flex-col items-center justify-center bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
      <h2 className="text-xl font-bold mb-6 text-dark">LOGIN</h2>
      <input
        type="text"
        placeholder="ID"
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-secondary text-white py-2 rounded-md hover:bg-primaryLight transition duration-300"
      >
        Login
      </button>
      <p className="my-4 text-dark">or</p>
      <div className="flex justify-center gap-2 w-full">
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
      <div className="mt-4">
        계정이 없다면?
        <button onClick={() => setShowSignupModal(true)} className="hover:underline text-blue-600 ml-1">
          Sign Up
        </button>
      </div>
      {showSignupModal && <SignupModal onClose={() => setShowSignupModal(false)} />}
    </div>
  );
}
