'use client';

import { useEffect, useRef, useState } from 'react';
import { GameCanvas } from "@/components/game/GameCanvas";
import ReadyCanvas from "@/components/game/ReadyCanvas";
import { useSearchParams } from 'next/navigation';
import { useMotionCapture } from '@/hooks/useMotionCapture';
import useWebRTCConnection from '@/hooks/useWebRTCConnection';

export default function GameMain() {
    const [roomId, setRoomId] = useState(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        setRoomId(searchParams.get('roomId'));
    }, []);
    
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [receivedPoseData, setReceivedPoseData] = useState({});
    const [landmarks, setLandmarks] = useState({
        nose: null,
        leftEye: null,
        rightEye: null,
        leftHand: null,
        rightHand: null,
    });
    const landmarksRef = useRef(landmarks);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        landmarksRef.current = landmarks;
    }, [landmarks]);
    
    useMotionCapture(localVideoRef, setLandmarks);

    // WebRTC 연결 설정
    useWebRTCConnection(
        roomId,
        localVideoRef,
        remoteVideoRef,
        (receivedData) => {
            // console.log('Received data:', receivedData);
            if (receivedData.type === 'pose') {
                setReceivedPoseData(receivedData.pose);
            }
        },
        () => landmarksRef.current
    );

    const handleReady = () => {
        setIsGameStarted(true);
    };

    const videoContainerStyle = (isLocal) => ({
        transition: 'all 0.5s ease-in-out',
        position: 'absolute',
        width: isGameStarted ? '200px' : 'calc(40vw - 10px)', // 좀 더 좁게 설정
        height: isGameStarted ? '150px' : 'calc((40vw - 10px) * 3/4)', // 4:3 비율 유지
        zIndex: 10,
        ...(isGameStarted
            ? { top: '10px', [isLocal ? 'right' : 'left']: '10px' }
            : { 
                top: '50%',
                left: isLocal ? 'calc(50% + 5px)' : 'calc(50% - 40vw - 5px)', 
                transform: 'translate(0, -50%)'
              }),
    });

    const videoStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '25px',
    };

    return (
        <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
            <div style={videoContainerStyle(true)}>
                <video
                    className="scale-x-[-1] opacity-80"
                    ref={localVideoRef}
                    style={videoStyle}
                    autoPlay
                    playsInline
                />
            </div>
            <div style={videoContainerStyle(false)}>
                {remoteVideoRef.current ? (
                    <video
                        className="scale-x-[-1] opacity-80"
                        ref={remoteVideoRef}
                        style={videoStyle}
                        autoPlay
                        playsInline
                    />
                ) : (
                    <div
                        className="bg-slate-400 opacity-80 flex items-center justify-center text-white"
                        style={videoStyle}
                    >
                        연결 대기 중...
                    </div>
                )}
            </div>
            <div className="absolute inset-0 z-0">
                {!isGameStarted ? (
                    <ReadyCanvas 
                        onReady={handleReady}
                    />
                ) : (
                    <GameCanvas 
                        receivedPoseData={receivedPoseData}
                        landmarks={landmarks}
                    />
                )}
            </div>
        </div>
    );
}