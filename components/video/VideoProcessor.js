'use client';
import { useEffect, useRef, useState } from 'react';
import useWorkerStore from '@/store/workerStore';
import useGameStore from '@/store/gameStore';

const VideoProcessor = ({ onLandmarksUpdate, style, gameStatus }) => {
    const videoRef = useRef(null);
    const { initWorker, setWorkerMessageHandler, isInitialized } = useWorkerStore();
    const myReady = useGameStore(state => state.myReady);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !videoRef.current) return;
        let videoStream = null;

        const setupVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                videoRef.current.srcObject = stream;
                videoStream = stream;
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = resolve;
                });
                await videoRef.current.play();
                setIsVideoReady(true);
            } catch (err) {
                console.error("Error setting up video:", err);
            }
        };

        const setupWorker = async () => {
            try {
                await initWorker(videoRef.current.videoWidth, videoRef.current.videoHeight);
                const { worker, videoArray: videoArray } = useWorkerStore.getState();
                console.log('워커 & 공유 버퍼 (비디오) 준비 완료!! :', worker, videoArray);
                setIsWorkerReady(true);

                const sendVideoFrame = () => {
                    if (videoRef.current && videoArray) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = videoRef.current.videoWidth;
                        tempCanvas.height = videoRef.current.videoHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        videoArray.set(imageData.data);

                        worker.postMessage({ type: 'FRAME_READY' });
                    }
                    requestAnimationFrame(sendVideoFrame);
                };
                requestAnimationFrame(sendVideoFrame);
            } catch (err) {
                console.error("Error setting up worker:", err);
            }
        };

        setupVideo().then(() => setupWorker());

        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [initWorker]);

    useEffect(() => {
        if (isInitialized) {
            setWorkerMessageHandler((e) => {
                if (e.data.type === 'LANDMARKS_UPDATED') {
                    onLandmarksUpdate(e.data);
                }
            });
        }
    }, [isInitialized, setWorkerMessageHandler, onLandmarksUpdate]);

    return (
        <>
            <video
                className={`scale-x-[-1] opacity-80 mt-2 transition-transform ${
                    (myReady && gameStatus !== 'playing') ? 'ring-green-400 ring-8' : ''
                }`}
                ref={videoRef}
                style={{...style, display: isVideoReady ? 'block' : 'none'}}
                autoPlay
                playsInline
            />
            {!isVideoReady && <div>Loading video...</div>}
            {isVideoReady && !isWorkerReady && <div>Initializing worker...</div>}
        </>
    );
};

export default VideoProcessor;