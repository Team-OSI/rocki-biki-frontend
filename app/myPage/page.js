'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/myPage/Navbar';

export default function MyPage() {
  const router = useRouter();

  const goToLobby = () => {
    router.push('/lobby'); 
  };

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
    </div>
  );
}