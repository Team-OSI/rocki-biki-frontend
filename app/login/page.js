'use client'

import SignupModal from '@/components/login/SignUpModal'
import React, { useState } from 'react'

export default function LoginModal({ onClose, onLogin }) {
  const [showModal, setShowModal] = useState(false);

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleApiRequest = async () => {
    try {
      const response = await fetch('http://rocki-biki.com:8080/api/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '안녕하세요' }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Response from API:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
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
        <button className="w-full bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-700 transition duration-300">
          Kakao Login
        </button>
        <div className="mt-4">
          계정이 없다면?
          <button onClick={() => setShowModal(true)} className='hover:underline text-blue-600'>
            Sign Up
          </button>
        </div>
        {showModal && <SignupModal onClose={() => setShowModal(false)} />}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">✕</button>
        <button 
          onClick={handleApiRequest} 
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 mt-4"
        >
          Send API Request
        </button>
      </div>
    </div>
  );
}