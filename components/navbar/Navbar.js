'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import React, { useState } from 'react';
import NicknameModal from '../lobby/NicknameModal';
import { useTitle } from "@/app/contexts/TitleContext";
import FriendsList from './FriendsList'
import { onFollowing, unFollowing } from "@/api/user/api";

export default function Navbar({ userEmail, userNickname, userProfileImage, onNicknameUpdate, follow, setFollow }) {
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

  const onAcceptRequest = async (friend) => {
    await onFollowing(friend.email);
    setFollow((prevFriends) => ({
      following: [...prevFriends.following, friend],
      follower: prevFriends.follower // Keep the friend in the follower list
    }));
  };

  const onCancelFollow = async (friend) => {
    await unFollowing(friend.email);
    setFollow((prevFriends) => ({
      following: prevFriends.following.filter(f => f.email !== friend.email),
      follower: prevFriends.follower.filter(f => f.email !== friend.email) // Remove from both lists if mutual
    }));
  };

  return (
      <>
        <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-50 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-4">
            <button onClick={toggleFriendsList} className="text-gray-300 hover:text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </button>
            <Link href="/public" className="text-gray-300 hover:text-white font-semibold">
              Main
            </Link>
          </div>
          <div className="text-white text-lg font-bold absolute left-1/2 transform -translate-x-1/2">
            {title}
          </div>
          <div className="flex items-center space-x-4">
            {userProfileImage && (
                <div className="relative w-10 h-10">
                  <Image
                      src={userProfileImage}
                      alt={`${userNickname}'s profile`}
                      className="rounded-full object-cover"
                      layout="fill"
                  />
                </div>
            )}
            <Link href={`/myPage/${encodeURIComponent(userEmail)}`}
                  className="text-gray-300 hover:text-white font-semibold">
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
            <div className="fixed top-14 left-0 w-full z-40">
              <FriendsList
                  following={follow.following}
                  follower={follow.follower}
                  onClose={toggleFriendsList}
                  onAcceptRequest={onAcceptRequest}
                  onCancelFollow={onCancelFollow}
              />
            </div>
        )}
        {isModalOpen && (
            <NicknameModal onClose={handleCloseModal} onSubmit={handleNicknameSubmit} />
        )}
      </>
  );
}
