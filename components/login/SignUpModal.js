// components/SignupModal.js
import React from 'react';

export default function SignupModal({ onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
        <h2 className="text-xl font-bold mb-6 text-dark">SIGN UP</h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
        />
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
        <button className="w-full bg-secondary text-white py-2 rounded-md hover:bg-primaryLight transition duration-300">
          Sign Up
        </button>
      </div>
    </div>
  );
}
