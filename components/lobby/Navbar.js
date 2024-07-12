import Link from 'next/link';
import { getNickname } from '@/api/user/api';
// import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';


export default function Navbar({ userNickname }) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('JWT_TOKEN');
    router.push('/');
  };

  return (
    <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center flex-grow">
          <Link href="/" className="text-gray-300 hover:text-white">
            Main
          </Link>
        </div>
        <div className="text-white text-lg font-bold">
          Lobby
        </div>
        <div className="flex items-center flex-grow justify-end">
          <Link href="/myPage" className="text-gray-300 hover:text-white">
            {userNickname}
          </Link>
          <button 
            className="text-gray-300 hover:text-white ml-4"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}