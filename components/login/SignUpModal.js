import React, { useState } from 'react';
import { signUp } from '@/api/user/api';

export default function SignupModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState(""); 
  const [passWord, setPassWord] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault(); 
    try {
      const response = await signUp(email, passWord);
      alert("Hello!!")
      onSuccess();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
        <h2 className="text-xl font-bold mb-6 text-dark">SIGN UP</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={passWord}
            onChange={(e) => setPassWord(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}