'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { GameCanvas } from "@/components/game/GameCanvas";
import ReadyCanvas from "@/components/game/ReadyCanvas";
import { useMotionCapture } from '@/hooks/useMotionCapture';
import useWebRTCConnection from '@/hooks/useWebRTCConnection';
import Image from 'next/image';
import SkillSelect from './skill/SkillSelect';
import useGameLogic from "@/hooks/useGameLogic";

export default function GameMain() {
    const [roomId, setRoomId] = useState(null);
    const { handleUseSkill } = useGameLogic();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        setRoomId(searchParams.get('roomId'));
    }, []);
    
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [receivedPoseData, setReceivedPoseData] = useState({});
    const [landmarks, setLandmarks] = useState({});
    const landmarksRef = useRef(landmarks);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        landmarksRef.current = landmarks;
    }, [landmarks]);

    const handleLandmarksUpdate = useCallback((newLandmarks) => {
        setLandmarks(prevLandmarks => {
            if (JSON.stringify(prevLandmarks) !== JSON.stringify(newLandmarks)) {
                return newLandmarks;
            }
            return prevLandmarks;
        });
    }, []);

    useMotionCapture(localVideoRef, handleLandmarksUpdate);

    // WebRTC 연결 설정
    const { connectionState} = useWebRTCConnection(
        roomId,
        localVideoRef,
        remoteVideoRef,
        useCallback((receivedData) => {
            if (receivedData.type === 'pose') {
                setReceivedPoseData(prevData => {
                    if (JSON.stringify(prevData) !== JSON.stringify(receivedData.pose)) {
                        return receivedData.pose;
                    }
                    return prevData;
                });
            }
        }, []),
        useCallback(() => landmarksRef.current, [])
    );

    const handleReady = useCallback(() => {
        setIsGameStarted(true);
    }, []);

    const videoContainerStyle = (isLocal) => ({
        transition: 'all 0.5s ease-in-out',
        position: 'absolute',
        width: isGameStarted ? '200px' : 'calc(40vw - 10px)', 
        height: isGameStarted ? '150px' : 'calc((40vw - 10px) * 3/4)', // 4:3 비율 유지
        zIndex: 30,
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

    const overlayStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.5,
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease-in-out',
    };

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const canvasRef = useRef(null);

    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const { width, height } = canvasRef.current.getBoundingClientRect();
                setCanvasSize(prevSize => {
                    if (prevSize.width !== width || prevSize.height !== height) {
                        return { width, height };
                    }
                    return prevSize;
                });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    const memoizedPoseLandmarks = useMemo(() => landmarks.poseLandmarks, [landmarks.poseLandmarks]);
    const memoizedLandmarks = useMemo(() => landmarks.landmarks, [landmarks.landmarks]);

    const gameContent = useMemo(() => (
        isGameStarted ? (
            <>
                <div className="absolute inset-0 z-10">
                    <GameCanvas
                        receivedPoseData={receivedPoseData}
                        landmarks={memoizedLandmarks}
                    />
                </div>
                <div className="absolute inset-0 z-40 pointer-events-none">
                    <SkillSelect
                        localVideoRef={localVideoRef}
                        poseLandmarks={memoizedPoseLandmarks}
                        landmarks={memoizedLandmarks}
                        canvasSize={canvasSize}
                        onUseSkill={handleUseSkill}
                    />
                </div>
            </>
        ) : (
            <div className="absolute inset-0 z-40">
                <ReadyCanvas
                    onReady={handleReady}
                    landmarks={memoizedPoseLandmarks}
                    canvasSize={canvasSize}
                />
            </div>
        )
    ), [isGameStarted, receivedPoseData, landmarks, canvasSize, handleUseSkill, handleReady, memoizedPoseLandmarks, memoizedLandmarks]);

    return (
        <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
            <div style={videoContainerStyle(true)}>
                <video
                    className="scale-x-[-1] opacity-80 mt-2"
                    ref={localVideoRef}
                    style={videoStyle}
                    autoPlay
                    playsInline
                />
                {!isGameStarted && (
                    <Image
                        src="/images/ready_pose.webp"
                        alt="Ready Pose"
                        fill
                        style={{ objectFit: 'cover', ...overlayStyle }}
                    />
                )}
            </div>
            <div style={videoContainerStyle(false)} className="z-30">
            <>
                {connectionState !== 'connected' &&(
                    <div
                    className="bg-slate-400 mt-2 opacity-80 flex items-center justify-center text-white"
                    style={videoStyle}
                    >
                    연결 대기 중...
                    </div>
                )}
                    <video
                        className="scale-x-[-1] opacity-80 mt-2"
                        ref={remoteVideoRef}
                        style={videoStyle}
                        autoPlay
                        playsInline
                    />
                    {!isGameStarted && (
                        <Image
                            src="/images/ready_pose.webp"
                            alt="Ready Pose"
                            fill
                            style={{ objectFit: 'cover', ...overlayStyle }}
                        />
                    )}
                </>
            </div>
            <div className="absolute inset-0" ref={canvasRef}>
                {gameContent}
            </div>
        </div>
    );
}