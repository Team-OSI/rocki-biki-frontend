import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import NicknameModal from './UpdateNicknameModal';

export default function Navbar({ userNickname, userProfileImage, onNicknameUpdate }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('JWT_TOKEN');
    router.push('/');
  };

  const handleNicknameClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleNicknameSubmit = (newNickname, newProfileImage) => {
    onNicknameUpdate(newNickname, newProfileImage);
    setIsModalOpen(false);
  };

  return (
      <>
        <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-10">
          <div className="container mx-auto flex items-center">
            <div className="flex items-center w-1/3">
              <Link href="/" className="text-gray-300 hover:text-white">
                Main
              </Link>
            </div>
            <div className="text-white text-lg font-bold w-1/3 text-center">
              My Page
            </div>
            <div className="flex items-center justify-end w-1/3">
              {userProfileImage && (
                  <img
                      src={userProfileImage}
                      alt={`${userNickname}의 프로필`}
                      className="w-8 h-8 rounded-full mr-2"
                  />
              )}
              <div
                  className="text-gray-300 hover:text-white cursor-pointer"
                  onClick={handleNicknameClick}
              >
                {userNickname}
              </div>
              <button
                  className="text-gray-300 hover:text-white ml-4"
                  onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          </div>
        </nav>
        {isModalOpen && (
            <NicknameModal onClose={handleCloseModal} onSubmit={handleNicknameSubmit} />
        )}
      </>
  );
}
