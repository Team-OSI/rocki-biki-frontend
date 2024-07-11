import React, { useState } from 'react';
import { login } from '@/api/user/api'; // 로그인 API 호출을 위한 함수 임포트
import SignupModal from '@/components/login/SignUpModal';

export default function LoginDiv({ onClose, onLogin }) {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form submission
    try {
      const response = await login(email, password); // 로그인 API 호출
      // console.log(response);
      alert("Welcom to Rocki-Biki!!")
      onLogin();
      onClose();
    } catch (err) {
      alert(err);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `http://172.30.1.16:8080/oauth2/authorization/${provider}?redirect_uri=http://localhost:3000&mode=login`;
  };

  const handleSignUpSuccess = () => {
    setShowSignupModal(false);
  }

  return (
    <div className="relative flex flex-col items-center justify-center bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md p-10 max-w-md text-center">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
      <h2 className="text-xl font-bold mb-6 text-dark">LOGIN</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
        <button
          type="submit"
          className="w-full bg-secondary text-white py-2 rounded-md hover:bg-primaryLight transition duration-300"
        >
          Login
        </button>
      </form>
      <p className="my-4 text-dark">or</p>
      <div className="flex justify-center gap-2 w-full">
        <button
          onClick={() => handleOAuthLogin('kakao')}
          className="flex-1 bg-yellow-400 text-white py-2 rounded-md hover:bg-yellow-700 transition duration-300"
        >
          Kakao 
        </button>
        <button
          onClick={() => handleOAuthLogin('google')}
          className="flex-1 bg-white text-black py-2 rounded-md hover:bg-gray-400 transition duration-300 border border-black"
        >
          Google 
        </button>
        <button
          onClick={() => handleOAuthLogin('naver')}
          className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-800 transition duration-300"
        >
          Naver 
        </button>
      </div>
      <div className="mt-4">
        계정이 없다면?
        <button onClick={() => setShowSignupModal(true)} className="hover:underline text-blue-600 ml-1">
          Sign Up
        </button>
      </div>
      { showSignupModal && < SignupModal onClose={() => setShowSignupModal(false)} onSuccess={handleSignUpSuccess} />}
    </div>
  );
}