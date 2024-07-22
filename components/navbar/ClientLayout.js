'use client';

import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { getUserEmail, getNickname, getFollowList } from '@/api/user/api';
import Navbar from '@/components/navbar/Navbar'; // Navbar 경로를 실제 위치로 수정하세요.
import { TitleProvider } from "@/app/contexts/TitleContext"; // TitleContext 경로를 실제 위치로 수정하세요.

export default function ClientLayout({ children }) {
    const [userEmail, setUserEmail] = useState('');
    const [userNickname, setUserNickname] = useState('');
    const [userProfileImage, setUserProfileImage] = useState('');
    const pathname = usePathname();
    const showNavbar = (pathname !== '/' && pathname !== '/game');
    const [follow, setFollow] = useState({ following: [], follower: [] });
    const navbarProps = useMemo(() => ({
        follow,
        userEmail,
        userNickname,
        userProfileImage,
        setFollow
    }), [userEmail, userNickname, userProfileImage, follow, setFollow])

    useEffect(() => {
        if (!showNavbar) return;
        const initializeUser = async () => {
            const email = await getUserEmail();
            const follow = await getFollowList();
            setUserEmail(email);
            setFollow(follow);

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
                    <Navbar {...navbarProps} />
                </div>
            )}
            <div className="flex-grow flex justify-center items-center">
                <main className="w-full">{children}</main>
            </div>
        </TitleProvider>
    );
}
