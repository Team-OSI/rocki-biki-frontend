'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCog } from 'react-icons/fa';
import ProfileEditModal from "@/components/myPage/ProfileEditModal";
import {getNickname, onFollowing, updateProfile} from '@/api/user/api';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';
import { useTitle } from "@/app/contexts/TitleContext";
import GameResultComponent from "@/components/myPage/GameResult";
import RecordingComponent from "@/components/myPage/Recording";
import { useMusic } from '@/app/contexts/MusicContext';

export default function MyPage() {
    const params = useParams();
    let { userEmail } = params;
    userEmail = decodeURIComponent(userEmail);
    const router = useRouter();
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
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

    const openProfileEditModal = () => setIsProfileEditModalOpen(true);
    const closeProfileEditModal = () => setIsProfileEditModalOpen(false);

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
        <div className="min-h-screen flex flex-col bg-cover bg-center pt-16"
             style={{backgroundImage: "url('/images/background2.webp')"}}>
            <div className="flex-grow flex items-center justify-center p-4 overflow-hidden">
                <div className="flex w-full max-w-7xl h-[calc(100vh-6rem)] bg-gray-50 bg-opacity-30 rounded-lg shadow-lg overflow-hidden">
                    {/* 왼쪽 열: 프로필 정보 */}
                    <div className="flex-1 p-8 flex flex-col items-center overflow-y-auto">
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
                                    <FaCog size={20}/>
                                </button>
                            )}
                        </div>
                        {!isCurrentUser && (
                            <button
                                className="text-white px-4 py-2 rounded-lg text-lg w-40 bg-[#50C710] hover:scale-105 mt-4"
                                onClick={following}
                            >
                                Following!
                            </button>
                        )}
                    </div>

                    {/* 오른쪽 열: 기능 버튼들 */}
                    <div className="flex-[2] p-8 bg-gray-50 bg-opacity-30 overflow-y-auto">
                        <div className="mb-8">
                            <RecordingComponent/>
                        </div>
                        <div>
                            <GameResultComponent userEmail={userEmail}/>
                        </div>
                    </div>
                </div>
            </div>

            <ProfileEditModal
                isOpen={isProfileEditModalOpen}
                onClose={closeProfileEditModal}
                onSubmit={handleProfileUpdate}
                currentNickname={userNickname}
                currentProfileImage={userProfileImage}
            />
        </div>
    );
}
