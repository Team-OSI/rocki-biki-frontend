'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUserEmail, getNickname } from '@/api/user/api';
import Navbar from '@/components/Navbar'; // Navbar 경로를 실제 위치로 수정하세요.
import { TitleProvider } from "@/app/contexts/TitleContext";

export default function ClientLayout({ children }) {
    const [userEmail, setUserEmail] = useState('');
    const [userNickname, setUserNickname] = useState('');
    const [userProfileImage, setUserProfileImage] = useState('');
    const pathname = usePathname();
    const showNavbar = (pathname !== '/' && pathname !== '/game');

    useEffect(() => {
        if (!showNavbar) return;
        const initializeUser = async () => {
            const email = await getUserEmail();
            setUserEmail(email);

            if (email) {
                try {
                    const response = await getNickname(email);
                    setUserProfileImage(response.profileImage);
                    setUserNickname(response.nickname);
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            } else {
                console.error("No user email found");
            }
        };

        initializeUser();
    }, [showNavbar]);

    return (
        <TitleProvider>
            {showNavbar && (
                <div className="flex-shrink-0">
                    <Navbar
                        userEmail={userEmail}
                        userNickname={userNickname}
                        userProfileImage={userProfileImage}
                        friends={[
                            'Friend 1',
                            'Friend 2',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            'Friend 3',
                            "Friend 3"
                        ]} // 친구 목록을 props로 전달
                    />
                </div>
            )}
            <div className="flex-grow flex justify-center items-center">
                <main className="w-full">{children}</main>
            </div>
        </TitleProvider>
    );
}
