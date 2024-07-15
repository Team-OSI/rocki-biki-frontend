'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/myPage/Navbar';
import RecordingModal from "@/components/myPage/RecordingModal";

export default function MyPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const goToLobby = () => {
        router.push('/lobby');
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <Navbar />
            <div className="mt-8">
                <h1 className="text-2xl font-bold">Welcome!</h1>
            </div>
            <button
                className="mt-4 bg-blue-500 text-white p-2 rounded-lg"
                onClick={goToLobby}
            >
                Go Lobby!
            </button>
            <button
                className="mt-4 bg-green-500 text-white p-2 rounded-lg"
                onClick={openModal}
            >
                피격음 녹음
            </button>
            <RecordingModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
}
