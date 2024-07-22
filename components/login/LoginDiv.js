import React, { useState } from 'react';
import SignupModal from '@/components/login/SignUpModal';
import { login } from '@/api/user/api'; // 로그인 API 호출을 위한 함수 임포트
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faEnvelope, faLock} from "@fortawesome/free-solid-svg-icons";

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
    window.location.href = `${process.env.NEXT_PUBLIC_SPRING_SERVER}/oauth2/authorization/${provider}?redirect_uri=${process.env.NEXT_PUBLIC_NEXT}`;
  };

  const handleSignUpSuccess = () => {
    setShowSignupModal(false);
  }

  return (
      <div
          className="relative flex flex-col w-1/2 py-5 px-10 items-center justify-center bg-white bg-opacity-70 border border-gray-300 rounded-lg shadow-md max-w-md text-center">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">✕</button>
          <h2 className="text-3xl font-bold mb-8 text-dark">LOGIN</h2>
          <form onSubmit={handleLogin} className="w-full">
              <div className="relative mb-4 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center w-full pointer-events-none">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-400"/>
                  </div>
                  <input
                      type="text"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                  />
              </div>
              <div className="relative mb-4 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center w-full pointer-events-none">
                      <FontAwesomeIcon icon={faLock} className="text-gray-400"/>
                  </div>
                  <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                  />
              </div>
              <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7ee70c] to-[#33d7d4] text-white py-2 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                  Login
              </button>
          </form>
          <div className="my-4 flex items-center w-full">
              <div className="flex-grow border-t border-gray-500"></div>
              <span className="flex-shrink mx-4 text-gray-500 font-medium">or</span>
              <div className="flex-grow border-t border-gray-500"></div>
          </div>
          <div className="flex justify-center gap-4 w-full">
              <button
                  onClick={() => handleOAuthLogin('kakao')}
                  className="w-12 h-12 rounded-full bg-yellow-400 text-white flex items-center justify-center hover:bg-yellow-700 transition duration-300"
                  aria-label="Login with Kakao"
              >
                  <img src="/images/logo/kakao.png" alt="Kakao" className="w-full h-full object-cover"/>
              </button>
              <button
                  onClick={() => handleOAuthLogin('google')}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition duration-300 border border-gray-300"
                  aria-label="Login with Google"
              >
                  <img src="/images/logo/google.png" alt="Google" className="w-full h-full object-cover"/>
              </button>
              <button
                  onClick={() => handleOAuthLogin('naver')}
                  className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-800 transition duration-300"
                  aria-label="Login with Naver"
              >
                  <img src="/images/logo/naver.png" alt="Naver" className="w-full h-full object-cover"/>
              </button>
          </div>
          <div className="mt-4 text-neutral-800">
              계정이 없다면?
              <button onClick={() => setShowSignupModal(true)} className="hover:underline text-blue-600 ml-1">
                  Sign Up
              </button>
          </div>
          {showSignupModal && <SignupModal onClose={() => setShowSignupModal(false)} onSuccess={handleSignUpSuccess}/>}
      </div>
  );
}