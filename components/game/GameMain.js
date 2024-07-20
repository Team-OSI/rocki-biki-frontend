'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import GameCanvas from "@/components/game/GameCanvas";
import ReadyCanvas from "@/components/game/ReadyCanvas";
import useWebRTCConnection from '@/hooks/useWebRTCConnection';
import Image from 'next/image';
import SkillSelect from './skill/SkillSelect';
import useGameLogic from '@/hooks/useGameLogic';
import { useRouter } from 'next/navigation';
import useSocketStore from '@/store/socketStore';
import useGameStore from '@/store/gameStore';
import useWorkerStore from '@/store/workerStore';

let frameCount = 0;
const LOG_INTERVAL = 60;
import GaugeUi from './GaugeUi';
import VideoProcessor from "@/components/video/VideoProcessor";
import {parseLandmarks} from "@/lib/utils/landmarkParser";

export default function GameMain() {
    const { sharedArray } = useWorkerStore();
    const videoRef = useRef(null);
    const roomId = useRef(null);
    const bgmSoundRef = useRef(null);

    useEffect(() => {
        bgmSoundRef.current = new Audio('./sounds/bgm.MP3');
      }, []);

    const playBgmSound = useCallback(() => {
    if (bgmSoundRef.current) {
        bgmSoundRef.current.play();
    }
    }, []);
    const { gameStatus, handleUseSkill } = useGameLogic(); //game 로직
    const router = useRouter();

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const roomIdFromUrl = searchParams.get('roomId');
        roomId.current = roomIdFromUrl;
    }, []);

    const [receivedPoseData, setReceivedPoseData] = useState({});
    const [landmarks, setLandmarks] = useState({});
    const landmarksRef = useRef(landmarks);
    const remoteVideoRef = useRef(null);

    const handleLandmarksUpdate = useCallback((data) => {
        if (!sharedArray) return;

        const { resultOffset, resultLength } = data;
        const result = sharedArray.slice(resultOffset, resultOffset + resultLength);
        const { landmarks, poseLandmarks } = parseLandmarks(result);

        setLandmarks({
            landmarks: landmarks,
            poseLandmarks: poseLandmarks
        });
    }, [sharedArray]);

    useEffect(()=> {
        landmarksRef.current = landmarks.landmarks
    },[landmarks])

    useEffect(() => {
        const onRoomClosed = () => {
          router.push('/lobby');
        };
    
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.on('ROOM_CLOSE', onRoomClosed);
        }
    
        return () => {
          if (socket) {
            socket.off('ROOM_CLOSE', onRoomClosed);
          }
        };
      }, [router]);

    // WebRTC 연결 설정
    const {
        connectionState,
        finalTranscript,
    } = useWebRTCConnection(
        roomId.current,
        videoRef,
        remoteVideoRef,
        (receivedData) => {
            // console.log('Received data:', receivedData);
            if (receivedData.type === 'pose') {
                setReceivedPoseData(receivedData.pose);
            }
        },
        () => landmarksRef.current
    );

    const myReady = useGameStore(state => state.myReady);
    const opponentReady = useGameStore(state => state.opponentReadyState)
    const emitGameStart = useSocketStore(state => state.emitGameStart);

    const handleReady = () => {
        playBgmSound();
        emitGameStart();
    };

    const videoContainerStyle = (isLocal) => ({
        transition: 'all 0.5s ease-in-out',
        position: 'absolute',
        width: (['playing', 'finished'].includes(gameStatus)) ? '200px' : 'calc(40vw - 10px)',
        height: ['playing', 'finished'].includes(gameStatus) ? '150px' : 'calc((40vw - 10px) * 3/4)', // 4:3 비율 유지
        zIndex: 30,
        ...(['playing', 'finished'].includes(gameStatus)
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
    const cameraRef = useRef(null);

    useEffect(() => {
        const updateCanvasSize = () => {
            if (cameraRef.current) {
                const { width, height } = cameraRef.current.getBoundingClientRect();
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

    return (
        <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
            {gameStatus === 'playing' && <GaugeUi />}
            <div style={videoContainerStyle(true)}>
                <VideoProcessor
                    onLandmarksUpdate={handleLandmarksUpdate}
                    style={videoStyle}
                    gameStatus={gameStatus}
                />
                {!myReady && (
                    <Image
                        src="/images/ready_pose.webp"
                        alt="Ready Pose"
                        layout="fill"
                        objectFit="cover"
                        style={overlayStyle}
                    />
                )}
            </div>
            <div style={videoContainerStyle(false)} className="z-30">
            <>
                {connectionState !== 'connected' &&(
                    <div
                    className="bg-slate-400 mt-5 opacity-80 flex items-center justify-center text-white"
                    style={videoStyle}
                    >
                    연결 대기 중...
                    </div>
                )}
                    <video
                        className={`scale-x-[-1] opacity-80 mt-5 transition-transform  ${
                            (opponentReady && gameStatus !== 'playing') ? 'ring-green-400 ring-8' : ''
                          }`}
                        ref={remoteVideoRef}
                        style={videoStyle}
                        autoPlay
                        playsInline
                    />
                    {(!opponentReady && connectionState === 'connected') && (
                        <Image
                            src="/images/ready_pose.webp"
                            alt="Ready Pose"
                            layout="fill"
                            objectFit="cover"
                            style={overlayStyle}
                        />
                    )}
                </>
            </div>
            <div className="absolute inset-0" ref={cameraRef}>
                {gameStatus === 'waiting' || gameStatus === 'bothReady' ? (
                    <div className="absolute inset-0 z-40">
                        <ReadyCanvas
                            onReady={handleReady}
                            landmarks={landmarks.poseLandmarks}
                            canvasSize={canvasSize}
                        />
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 z-10">
                            <GameCanvas
                                receivedPoseData={receivedPoseData}
                                landmarks={landmarks.landmarks}
                            />
                        </div>
                        <div className="absolute inset-0 z-40 pointer-events-none">
                            <SkillSelect
                                localVideoRef={videoRef}
                                poseLandmarks={landmarks.poseLandmarks}
                                landmarks={landmarks.landmarks}
                                canvasSize={canvasSize}
                                onUseSkill={handleUseSkill}
                                finalTranscript={finalTranscript}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}