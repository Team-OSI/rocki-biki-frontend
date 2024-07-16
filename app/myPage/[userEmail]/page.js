'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCog } from 'react-icons/fa';
import Navbar from '@/components/myPage/Navbar';
import RecordingModal from "@/components/myPage/RecordingModal";
import ProfileEditModal from "@/components/myPage/ProfileEditModal";
import GameResultModal from "@/components/myPage/GameResultModal";
import { getNickname, updateProfile } from '@/api/user/api';
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

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
            const decoded = jwtDecode(token); // jwtDecode 함수 호출
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

    const goToLobby = () => {
        router.push('/lobby');
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
            <Navbar
                userNickname={userNickname}
                userProfileImage={userProfileImage}
            />
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
                                <FaCog size={20}/>
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-4 mt-6">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-lg w-40"
                        onClick={goToLobby}
                    >
                        Go Lobby!
                    </button>
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
                    <RecordingModal isOpen={isRecordingModalOpen} onClose={closeRecordingModal}/>
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
