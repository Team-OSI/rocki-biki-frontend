'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaCog } from 'react-icons/fa'; // 톱니바퀴 아이콘을 위해 react-icons 설치 필요
import Navbar from '@/components/myPage/Navbar';
import RecordingModal from "@/components/myPage/RecordingModal";
import ProfileEditModal from "@/components/myPage/ProfileEditModal"; // 새로 만들 컴포넌트
import { getNickname, updateProfile } from '@/api/user/api';
import GameResultModal from "@/components/myPage/GameResultModal";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode"; // updateProfile API 함수 추가 필요

export default function MyPage({ userEmail }) {
    const router = useRouter();
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
    const [isGameResultModalOpen, setIsGameResultModalOpen] = useState(false);
    const [userNickname, setUserNickname] = useState("");
    const [userProfileImage, setUserProfileImage] = useState("");

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const currentUserEmail = getCurrentUserEmail();
        setIsCurrentUser(currentUserEmail === userEmail);
        fetchUserData();
    }, [userEmail]);

    const getCurrentUserEmail = () => {
        const token = Cookies.get('JWT_TOKEN');
        const decoded = jwtDecode(token);
        return decoded.sub;
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

    const openGameResultModal = () => setIsGameResultModalOpen(true)
    const closeGameResultModal = ()=> setIsGameResultModalOpen(false)

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
                            src={userProfileImage || '/default-profile.jpg'}
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
                <button
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg text-lg"
                    onClick={goToLobby}
                >
                    Go Lobby!
                </button>
                {isCurrentUser && (
                    <button
                        className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg text-lg"
                        onClick={openRecordingModal}
                    >
                        피격음 녹음
                    </button>
                )}
                <button
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg text-lg"
                    onClick={openGameResultModal}
                >
                    대전 기록
                </button>
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
