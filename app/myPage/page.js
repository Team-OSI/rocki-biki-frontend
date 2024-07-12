'use client';

import { useRouter } from 'next/navigation';
import { getNickname } from '@/api/user/api';
import { useState, useEffect } from 'react';
import Navbar from '@/components/myPage/Navbar';

export default function MyPage() {
  const [userNickname, setUserNickname] = useState("");
  const [userProfileImage, setUserProfileImage] = useState(""); 

  useEffect(() => {
    const fetchNickname = async () => {
      try {
        const response = await getNickname();
        setUserNickname(response.nickname);
        setUserProfileImage(response.profileImage);
      } catch (err) {
        setShowNicknameModal(true);
      }
    };

    fetchNickname();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Navbar userNickname={userNickname} userProfileImage={userProfileImage}/>
      <div className="mt-8">
        <h1 className="text-2xl font-bold">Welcome, {userNickname}!</h1>
      </div>
    </div>
  );
}
