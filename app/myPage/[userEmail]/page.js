'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCog } from 'react-icons/fa';
import RecordingModal from "@/components/myPage/RecordingModal";
import ProfileEditModal from "@/components/myPage/ProfileEditModal";
import GameResultModal from "@/components/myPage/GameResultModal";
import { getNickname, onFollowing, updateProfile } from '@/api/user/api';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { useTitle } from "@/app/contexts/TitleContext";
import { useMusic } from '@/app/contexts/MusicContext';

export default function MyPage() {
  const params = useParams();
  let { userEmail } = params;
  userEmail = decodeURIComponent(userEmail);
  const router = useRouter();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isGameResultModalOpen, setIsGameResultModalOpen] = useState(false);
  const [userNickname, setUserNickname] = useState('');
  const [userProfileImage, setUserProfileImage] = useState('');
  const { setTitle } = useTitle();
  const { setVolume } = useMusic();

  useEffect(() => {
    setTitle("My Page");
  }, [setTitle]);

  useEffect(() => {
    setVolume(0.3); // 마이페이지에 들어올 때 볼륨 30%
    return () => {
      setVolume(1.0); // 마이페이지를 떠날 때 볼륨 100%
    };
  }, [setVolume]);

  useEffect(() => {
    fetchUserData();
  }, [userEmail]);

  useEffect(() => {
    const currentUserEmail = getCurrentUserEmail();
    setIsCurrentUser(currentUserEmail === userEmail);
  }, [userEmail]);

  const getCurrentUserEmail = () => {
    const token = Cookies.get('JWT_TOKEN');
    if (!token) {
      return null;
    }
    try {
      const decoded = jwtDecode(token);
      return decoded.sub;
    } catch (error) {
      console.error('JWT decoding failed:', error);
      return null;
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await getNickname(userEmail);
      setUserNickname(response.nickname);
      setUserProfileImage(response.profileImage);
    } catch (err) {
      console.log(err);
    }
  };

  const following = async () => {
    await onFollowing(userEmail);
    alert("Following!");
  };

  const openRecordingModal = () => setIsRecordingModalOpen(true);
  const closeRecordingModal = () => setIsRecordingModalOpen(false);

  const openProfileEditModal = () => setIsProfileEditModalOpen(true);
  const closeProfileEditModal = () => setIsProfileEditModalOpen(false);

  const openGameResultModal = () => setIsGameResultModalOpen(true);
  const closeGameResultModal = () => setIsGameResultModalOpen(false);

  const handleProfileUpdate = async (newNickname, newProfileImage) => {
    try {
      const response = await updateProfile(newNickname, newProfileImage);
      setUserNickname(response.nickname);
      setUserProfileImage(response.profileImage);
      closeProfileEditModal();
    } catch (err) {
      console.error("프로필 업데이트 실패:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="flex flex-col items-center relative">
          <div className="w-80 h-80 rounded-full overflow-hidden mb-4">
            <Image
              src={userProfileImage || '/images/default_profile.png'}
              alt="Profile"
              width={320}
              height={320}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold mr-2">{userNickname}</h2>
            {isCurrentUser && (
              <button onClick={openProfileEditModal} className="text-gray-600 hover:text-gray-800">
                <FaCog size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center space-y-4 mt-6">
          {!isCurrentUser && (
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-lg w-40"
              onClick={following}
            >
              Following!
            </button>
          )}
          {isCurrentUser && (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-lg w-40"
              onClick={openRecordingModal}
            >
              피격음 녹음
            </button>
          )}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-lg w-40"
            onClick={openGameResultModal}
          >
            대전 기록
          </button>
        </div>
      </div>
      {isCurrentUser && (
        <>
          <RecordingModal isOpen={isRecordingModalOpen} onClose={closeRecordingModal} />
          <ProfileEditModal
            isOpen={isProfileEditModalOpen}
            onClose={closeProfileEditModal}
            onSubmit={handleProfileUpdate}
            currentNickname={userNickname}
            currentProfileImage={userProfileImage}
          />
        </>
      )}
      <GameResultModal
        isOpen={isGameResultModalOpen}
        onClose={closeGameResultModal}
        userEmail={userEmail}
      />
    </div>
  );
}
