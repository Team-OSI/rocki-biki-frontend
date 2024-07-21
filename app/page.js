'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginDiv from '@/components/login/LoginDiv';
import Cookies from 'js-cookie';
import Image from "next/image";
            
export default function App() {
  const [login, setLogin] = useState(false);
  const [showLoginDiv, setShowLoginDiv] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('JWT_TOKEN');
    if (token) {
      setLogin(true);
    }
  },[]);

  const handleLogin = () => {
    setLogin(true);
    setShowLoginDiv(false);
  };

  const handleButtonClick = () => {
    if (login) {
      router.push('/lobby');
    } else {
      setShowLoginDiv(true);
    }
  };

  return (
    <div className="relative pt-5 flex flex-col items-center justify-between min-h-screen p-6 bg-cover bg-center" style={{ backgroundImage: "url('/images/background.webp')" }}>
      <div className="w-full animate-bounce mb-1 mt-5 flex flex-col items-center font-bold">
        <Image
            src="/images/rockibiki_logo.webp"
            alt="ROCKI BIKI Logo"
            width={400}
            height={400}
        />
      </div>
      {showLoginDiv ? (
        <div className="flex flex-col items-center gap-3 w-full max-w-screen-md mt-80 mb-30">
          <LoginDiv
            onClose={() => setShowLoginDiv(false)}
            onLogin={handleLogin}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full max-w-screen-md mt-auto mb-40">
          <button
            onClick={handleButtonClick}
            className="bg-secondary text-white font-bold text-3xl py-5 px-20 rounded-lg hover:bg-secondary-dark transition duration-300"
          >
            {login ? "Game Start" : "Login"}
          </button>
        </div>
      )}
      {/* <button onClick={testLogin} className="mt-4">test</button> */}
    </div>
  );
}