// pages/index.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginDiv from '@/components/login/LoginDiv';
import Cookies from 'js-cookie';
import Image from "next/image";
import { useMusic } from '@/app/contexts/MusicContext';

export default function App() {
  const [login, setLogin] = useState(false);
  const [showLoginDiv, setShowLoginDiv] = useState(false);
  const router = useRouter();
  const { playMainBgm } = useMusic();

  useEffect(() => {
    playMainBgm();
    const token = Cookies.get('JWT_TOKEN');
    if (token) {
      setLogin(true);
    }
  }, [playMainBgm]);

  const handleLogin = () => {
    setLogin(true);
    setShowLoginDiv(false);
  };

  useEffect(() => {
    if (login) {
      router.push('/lobby');
    }
  }, [login, router]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-cover bg-center"
         style={{ backgroundImage: "url('/images/background.png')" }}>
      <div className="w-full max-w-screen-md flex flex-col items-center justify-center -mt-16">
        {!showLoginDiv && (
          <div
            className="w-full animate-small-bounce mb-1 flex flex-col items-center font-bold cursor-pointer"
            onClick={() => setShowLoginDiv(true)}
          >
            <Image
              src="/images/welcome.png"
              alt="ROCKI BIKI Logo"
              width={300}
              height={300}
            />
          </div>
        )}
        {showLoginDiv && (
          <LoginDiv
            onClose={() => setShowLoginDiv(false)}
            onLogin={handleLogin}
          />
        )}
      </div>
    </div>
  );
}
