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
import VideoComponent from "@/components/video/VideoComponent";

export default function GameMain() {
    const { sharedArray } = useWorkerStore();
    const roomInfo = useGameStore(state => state.roomInfo);
    const socket = useSocketStore(state => state.socket);
    const opponentSkills = useGameStore(state => state.opponentSkills);
    const videoRef = useRef(null);
    const roomId = useRef(null);
    const { playReadyBgm, playGameBgm, stopAllMusic } = useMusic();

    const { gameStatus, handleUseSkill } = useGameLogic(); // game 로직
    const router = useRouter();
    
    const [myNickname, setMyNickname] = useState('');
    const [opponentNickname, setOpponentNickname] = useState('');
    const [isOpponentUsingSkill, setIsOpponentUsingSkill] = useState(false);

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
        if (opponentSkills[0] !== null && gameStatus === 'skillTime') {
            setIsOpponentUsingSkill(true);
            setTimeout(() => setIsOpponentUsingSkill(false), 4000); // 4초 후 원래 상태로 돌아갑니다
        }
    }, [opponentSkills, gameStatus]);

    useEffect(() => {
        if (['waiting', 'bothReady'].includes(gameStatus)) {
            playReadyBgm();
        } else if (['playing', 'skillTime'].includes(gameStatus)) {
            playGameBgm();
        }
    }, [gameStatus, playGameBgm, playReadyBgm]);

    return (
        <div className="relative w-screen h-screen overflow-hidden"
             style={{backgroundImage: 'url(/images/ready_background.png)', backgroundSize: 'cover'}}>
            {gameStatus === 'playing' && <GaugeUi/>}
            <VideoComponent
                isLocal={true}
                isOpponentUsingSkill={false}
                gameStatus={gameStatus}
                ready={myReady}
                nickname={myNickname}
                videoRef={videoRef}
                connectionState={connectionState}
                handleLandmarksUpdate={handleLandmarksUpdate}
            />
            <VideoComponent
                isLocal={false}
                isOpponentUsingSkill={isOpponentUsingSkill}
                gameStatus={gameStatus}
                ready={opponentReady}
                nickname={opponentNickname}
                videoRef={remoteVideoRef}
                connectionState={connectionState}
            />
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
