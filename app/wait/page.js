'use client';

import React, { useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import useWebRTC from '@/hooks/useWebRTC'; // useWebRTC 훅을 import

export default function Wait() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');

  useWebRTC(roomId, localVideoRef, remoteVideoRef); // useWebRTC 훅을 사용

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="flex flex-col items-center gap-4">
        <video ref={localVideoRef} autoPlay playsInline className="rounded-lg shadow-lg" />
        <video ref={remoteVideoRef} autoPlay playsInline className="rounded-lg shadow-lg" />
      </div>
    </div>
  );
}
