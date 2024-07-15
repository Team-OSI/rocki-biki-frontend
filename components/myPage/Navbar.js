import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import NicknameModal from './UpdateNicknameModal';
import { getNickname } from '@/api/user/api';

export default function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userNickname, setUserNickname] = useState("");
  const [userProfileImage, setUserProfileImage] = useState(""); 

  useEffect(() => {
    const fetchNickname = async () => {
      try {
        const response = await getNickname();
        setUserNickname(response.nickname);
        setUserProfileImage(response.profileImage);
      } catch (err) {
        console.log(err);
      }
    };
  
    fetchNickname();
  }, []);

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
    setUserNickname(newNickname);
    setUserProfileImage(newProfileImage);
    window.location.reload();
  };

  return (
    <>
      <nav className="bg-gray-800 p-4 fixed w-full top-0 left-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center flex-grow">
            <Link href="/" className="text-gray-300 hover:text-white">
              Main
            </Link>
          </div>
          <div className="text-white text-lg font-bold">
            My Page
          </div>
          <div className="flex items-center flex-grow justify-end">
            {userProfileImage && (
              <img 
                src={userProfileImage} 
                alt={`${userNickname}의 프로필`} 
                className="w-8 h-8 rounded-full mr-2"
              />
            )}
            <div className="text-gray-300 hover:text-white cursor-pointer" onClick={handleNicknameClick}>
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
