'use client';
import { useEffect, useRef, useState } from 'react';
import useWorkerStore from '@/store/workerStore';
import useGameStore from '@/store/gameStore';

const VideoProcessor = ({ onLandmarksUpdate, style, gameStatus }) => {
    const videoRef = useRef(null);
    const { initWorker, setWorkerMessageHandler, isInitialized, videoArray } = useWorkerStore();
    const myReady = useGameStore(state => state.myReady);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !videoRef.current) return;
        let videoStream = null;

        const setupVideo = async () => {
            try {
                console.log("Starting video setup");
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                videoRef.current.srcObject = stream;
                videoStream = stream;
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = resolve;
                });
                await videoRef.current.play();
                console.log("Video setup complete");
                setIsVideoReady(true);
            } catch (err) {
                console.error("Error setting up video:", err);
            }
        };

        const setupWorker = async () => {
            try {
                console.log("Starting worker setup");
                await initWorker(videoRef.current.videoWidth, videoRef.current.videoHeight);
                const { worker, videoArray: updatedVideoArray } = useWorkerStore.getState();

                if (!worker || !updatedVideoArray) {
                    throw new Error("Worker or videoArray not available after initialization");
                }

                console.log('Worker and videoArray ready:', worker, updatedVideoArray);
                setIsWorkerReady(true);

                const sendVideoFrame = () => {
                    if (videoRef.current && updatedVideoArray) {
                        const startTime = performance.now();
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = videoRef.current.videoWidth;
                        tempCanvas.height = videoRef.current.videoHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCtx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
                        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                        updatedVideoArray.set(imageData.data);

                        worker.postMessage({ type: 'frameReady', startTime: startTime });
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
                    const endTime = performance.now();
                    const startTime = e.data.startTime;
                    const delay = endTime - startTime;
                    console.log(`delay: ${delay.toFixed(2)} ms`);

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