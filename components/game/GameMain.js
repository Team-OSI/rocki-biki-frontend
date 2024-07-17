'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import { GameCanvas } from "@/components/game/GameCanvas";
import ReadyCanvas from "@/components/game/ReadyCanvas";
import { useMotionCapture } from '@/hooks/useMotionCapture';
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

export default function GameMain() {
    const { initWorker, terminateWorker, setWorkerMessageHandler, sharedArray, isInitialized } = useWorkerStore();
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    useEffect(() => {
        if (canvasRef.current) {
            setIsCanvasReady(true);
        }
    }, [canvasRef]);

    useEffect(() => {
        if (typeof window === 'undefined' || !videoRef.current) return;
        let videoStream = null;
        let originalCanvas = null;
        let originalCtx = null;

        const setupVideoAndWorker = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                videoRef.current.srcObject = stream;
                videoStream = stream;
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = resolve;
                });

                try {
                    await videoRef.current.play();
                } catch (playError) {
                    console.warn("Video play was interrupted:", playError);
                }

                // 새로운 캔버스 생성 및 컨텍스트 가져오기
                originalCanvas = document.createElement('canvas');
                originalCanvas.width = videoRef.current.videoWidth / 3;
                originalCanvas.height = videoRef.current.videoHeight / 3;
                originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });

                // OffscreenCanvas 생성
                const offscreenCanvas = new OffscreenCanvas(originalCanvas.width, originalCanvas.height);
                await initWorker(originalCanvas.width, originalCanvas.height);

                const worker = useWorkerStore.getState().worker;
                worker.postMessage({
                    type: 'VIDEO_INIT',
                    offscreenCanvas: offscreenCanvas,
                    width: originalCanvas.width,
                    height: originalCanvas.height
                }, [offscreenCanvas]);

                const sendVideoFrame = () => {
                    if (videoRef.current && originalCtx) {
                        originalCtx.drawImage(videoRef.current, 0, 0, originalCanvas.width, originalCanvas.height);
                        const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

                        worker.postMessage({
                            type: 'VIDEO_FRAME',
                            imageData: imageData
                        }, [imageData.data.buffer]);
                    }
                    requestAnimationFrame(sendVideoFrame);
                };
                requestAnimationFrame(sendVideoFrame);
            } catch (err) {
                console.error("Error setting up video and worker:", err);
            }
        };

        setupVideoAndWorker();

        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [initWorker]);

    // 캔버스 초기화를 위한 별도의 useEffect
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.width = 640;
            canvasRef.current.height = 480;
            console.log('Canvas dimensions:', canvasRef.current.width, 'x', canvasRef.current.height);
        } else {
            console.error('Canvas reference is null after mount');
        }
    }, []);

    useEffect(() => {
        if (isInitialized) {
            setWorkerMessageHandler((e) => {
                if (e.data.type === 'LANDMARKS_UPDATED') {
                    // 랜드마크 업데이트 처리
                    handleLandmarksUpdate(e.data);
                }
            });
        }
    }, [isInitialized, setWorkerMessageHandler]);

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
    const { gameStatus } = useGameLogic(); //game 로직
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
        let index = 0;

        // landmarks 파싱
        const landmarks = {};
        if (result[0]) { // landmarks 존재 여부
            const keys = ['head', 'leftHand', 'rightHand'];
            keys.forEach(key => {
                const position = [result[index++], result[index++], result[index++]]; // position
                let rotation;
                if (key === 'head') {
                    rotation = [result[index++], result[index++], result[index++]]; // head rotation (3 values)
                } else {
                    rotation = [result[index++], result[index++]]; // hand rotation (2 values)
                }
                const state = result[index++]; // state
                landmarks[key] = [position, rotation, state];
            });
        }

        // poseLandmarks 파싱
        const poseLandmarks = {};
        if (result[index++]) { // poseLandmarks 존재 여부
            const keys = ['nose', 'rightEye', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftWrist', 'rightWrist', 'leftIndex', 'rightIndex'];
            keys.forEach(key => {
                poseLandmarks[key] = {
                    x: result[index++],
                    y: result[index++],
                    z: result[index++]
                };
            });
        }

        // frameCount++;
        // if (frameCount % LOG_INTERVAL === 0) {
        //     console.log('Parsed poseLandmarks - head:', landmarks['head']);
        //     console.log('Parsed poseLandmarks - leftHand:', landmarks['leftHand']);
        //     console.log('Parsed poseLandmarks - rightHand:', landmarks['rightHand']);
        //     console.log('Parsed Landmarks - nose:', poseLandmarks['nose']);
        // }

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
    const connectionState = useWebRTCConnection(
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
                <video
                    className={`scale-x-[-1] opacity-80 mt-2 transition-transform  ${
                        (myReady && gameStatus !== 'playing') ? 'ring-green-400 ring-8' : ''
                      }`}
                    ref={videoRef}
                    style={videoStyle}
                    autoPlay
                    playsInline
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
                    className="bg-slate-400 mt-2 opacity-80 flex items-center justify-center text-white"
                    style={videoStyle}
                    >
                    연결 대기 중...
                    </div>
                )}
                    <video
                        className={`scale-x-[-1] opacity-80 mt-2 transition-transform  ${
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
                        {/* <div className="absolute inset-0 z-40 pointer-events-none">
                            <SkillSelect
                                localVideoRef={localVideoRef}
                                poseLandmarks={landmarks.poseLandmarks}
                                landmarks={landmarks.landmarks}
                                canvasSize={canvasSize}
                                onUseSkill={handleUseSkill}
                            />
                        </div> */}
                    </>
                )}
            </div>
        </div>
    );
}