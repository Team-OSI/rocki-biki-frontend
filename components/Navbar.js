'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import React, { useState } from 'react';
import NicknameModal from './lobby/NicknameModal';
import { useTitle } from "@/app/contexts/TitleContext";

export default function Navbar({ userEmail, userNickname, userProfileImage, onNicknameUpdate, friends }) {
  const { title } = useTitle();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false);

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

  const toggleFriendsList = () => {
    setIsFriendsListOpen(!isFriendsListOpen);
  };

  return (
      <>
        <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-50 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-4">
            <button onClick={toggleFriendsList} className="text-gray-300 hover:text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
            <Link href="/" className="text-gray-300 hover:text-white font-semibold">
              Main
            </Link>
          </div>
          <div className="text-white text-lg font-bold absolute left-1/2 transform -translate-x-1/2">
            {title}
          </div>
          <div className="flex items-center space-x-4">
            {userProfileImage && (
                <img
                    src={userProfileImage}
                    alt={`${userNickname}'s profile`}
                    className="w-8 h-8 rounded-full"
                />
            )}
            <Link href={`/myPage/${encodeURIComponent(userEmail)}`} className="text-gray-300 hover:text-white font-semibold">
              {userNickname}
            </Link>
            <button
                className="text-gray-300 hover:text-white font-semibold"
                onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </nav>
        {isFriendsListOpen && (
            <div className="fixed top-16 left-0 w-1/4 h-auto bg-gray-900 bg-opacity-90 text-white z-40 transition-transform transform translate-x-0 shadow-lg overflow-auto max-h-screen rounded-br-lg">
              <div className="p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">친구 목록</h2>
                  <button onClick={toggleFriendsList} className="text-gray-300 hover:text-white focus:outline-none">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                <ul className="space-y-2">
                  {friends.map((friend, index) => (
                      <li key={index} className="py-2 px-4 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
                        {friend}
                      </li>
                  ))}
                </ul>
              </div>
            </div>
        )}
        {isModalOpen && (
            <NicknameModal onClose={handleCloseModal} onSubmit={handleNicknameSubmit} />
        )}
      </>
  );
}
