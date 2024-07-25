'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import GaugeUi from './GaugeUi';
import VideoProcessor from "@/components/video/VideoProcessor";
import { parseLandmarks } from "@/lib/utils/landmarkParser";
import { useMusic } from '@/app/contexts/MusicContext';

export default function GameMain() {
    const { sharedArray } = useWorkerStore();
    const roomInfo = useGameStore(state => state.roomInfo);
    const socket = useSocketStore(state => state.socket);
    const videoRef = useRef(null);
    const roomId = useRef(null);
    const { playReadyBgm, playGameBgm, stopAllMusic } = useMusic();

    const { gameStatus, handleUseSkill } = useGameLogic(); // game 로직
    const router = useRouter();
    
    const [myNickname, setMyNickname] = useState('');
    const [opponentNickname, setOpponentNickname] = useState('');

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

    useEffect(() => {
        landmarksRef.current = landmarks.landmarks;
    }, [landmarks]);

    useEffect(() => {
        const onRoomClosed = () => {
            router.push('/lobby');
        };

        if (socket) {
            socket.on('ROOM_CLOSE', onRoomClosed);
        }

        return () => {
            if (socket) {
                socket.off('ROOM_CLOSE', onRoomClosed);
            }
        };
    }, [router, socket]);

    useEffect(() => {
        if (roomInfo && socket && roomInfo.playerInfo) {
            const player = roomInfo.playerInfo.find(p => p.socketId === socket.id);
            const opponent = roomInfo.playerInfo.find(p => p.socketId !== socket.id);
            if (player) setMyNickname(player.nickname);
            if (opponent) setOpponentNickname(opponent.nickname);
        }
    }, [roomInfo, socket]);

    useEffect(() => {
        const handlePlayerInfo = (playerInfo) => {
            if (playerInfo.socketId === socket.id) {
                setMyNickname(playerInfo.nickname);
            } else {
                setOpponentNickname(playerInfo.nickname);
            }
        };

        if (socket) {
            socket.on('PLAYER_INFO', handlePlayerInfo);
        }

        return () => {
            if (socket) {
                socket.off('PLAYER_INFO', handlePlayerInfo);
            }
        };
    }, [socket]);

    // WebRTC 연결 설정
    const {
        connectionState,
        finalTranscript,
    } = useWebRTCConnection(
        roomId.current,
        videoRef,
        remoteVideoRef,
        (receivedData) => {
            if (receivedData.type === 'pose') {
                setReceivedPoseData(receivedData.pose);
            }
        },
        () => landmarksRef.current
    );

    const myReady = useGameStore(state => state.myReady);
    const opponentReady = useGameStore(state => state.opponentReadyState);
    const emitGameStart = useSocketStore(state => state.emitGameStart);
    const setIsLoadingImages = useGameStore(state => state.setIsLoadingImages);
    const isLoadingImages = useGameStore(state => state.isLoadingImages);
    const opponentInfo = useGameStore(state => state.opponentInfo);

    const handleReady = () => {
        console.log('opInfo: ', opponentInfo);
        emitGameStart();
    };

    const videoContainerStyle = (isLocal) => ({
        transition: 'all 0.5s ease-in-out',
        position: 'absolute',
        width: ['playing', 'finished', 'skillTime'].includes(gameStatus) ? '200px' : 'calc(40vw - 10px)',
        height: ['playing', 'finished', 'skillTime'].includes(gameStatus) ? '150px' : 'calc((40vw - 10px) * 3/4)', // 4:3 비율 유지
        zIndex: 30,
        ...(['playing', 'finished', 'skillTime'].includes(gameStatus)
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

    const nicknameStyle = {
        position: 'absolute',
        bottom: '-38px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px',
        color: 'white', 
        backgroundColor: 'black', 
        padding: '0px 40px',
        borderRadius: '20px / 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap'
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

    useEffect(() => {
        if (['waiting', 'bothReady'].includes(gameStatus)) {
            playReadyBgm();
        } else if (['playing', 'skillTime'].includes(gameStatus)) {
            playGameBgm();
        }
    }, [gameStatus, playGameBgm, playReadyBgm]);

    return (
        <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundImage: 'url(/images/ready_background.png)', backgroundSize: 'cover' }}>
            {gameStatus === 'playing' && <GaugeUi />}
            <div style={videoContainerStyle(true)}>
                <div className="relative w-full h-full">
                    <VideoProcessor
                        ref={videoRef}
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
                    {myReady && (
                        <img src="/images/ready_logo.png" className="absolute top-[-124px] right-0 transform -translate-x-1/2 w-1/2 h-auto" alt="Ready Logo" />
                    )}
                    <div style={nicknameStyle}>{myNickname}</div>
                </div>
            </div>
            <div style={videoContainerStyle(false)} className="z-30">
                <div className="relative w-full h-full">
                    {connectionState !== 'connected' && (
                        <div
                            className="bg-slate-400 mt-5 opacity-80 flex items-center justify-center text-white"
                            style={videoStyle}
                        >
                            연결 대기 중...
                        </div>
                    )}
                    <video
                        className={`scale-x-[-1] opacity-80 mt-5 transition-transform ${
                            (opponentReady && !['playing', 'finished', 'skillTime'].includes(gameStatus)) ? 'ring-green-400 ring-8' : ''
                        }`}
                        ref={remoteVideoRef}
                        style={videoStyle}
                        autoPlay
                        playsInline
                    />
                    {!opponentReady && connectionState === 'connected' && (
                        <Image
                            src="/images/ready_pose.webp"
                            alt="Ready Pose"
                            layout="fill"
                            objectFit="cover"
                            style={overlayStyle}
                        />
                    )}
                    {opponentReady && (
                        <img src="/images/ready_logo.png" className="absolute top-[-124px] right-0 transform -translate-x-1/2 w-1/2 h-auto" alt="Ready Logo" />
                    )}
                    <div style={nicknameStyle}>{opponentNickname}</div>
                </div>
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
