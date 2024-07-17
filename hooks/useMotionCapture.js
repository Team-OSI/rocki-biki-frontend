// import { useCallback, useEffect, useRef } from "react";
// import useWorkerStore from "@/store/workerStore";
//
// export function useMotionCapture(onLandmarksUpdate) {
//     const { initWorker, isInitialized, setWorkerMessageHandler } = useWorkerStore();
//     const videoRef = useRef(null);
//     const isCapturingRef = useRef(false);
//     const frameInterval = 1000 / 10;
//
//     useEffect(() => {
//         if (typeof window === 'undefined') return;
//         let videoStream = null;
//
//         const setupVideoAndWorker = async () => {
//             try {
//                 const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//                 videoStream = stream;
//
//                 const video = document.createElement('video');
//                 video.srcObject = stream;
//                 video.onloadedmetadata = async () => {
//                     video.play();
//                     const canvas = document.createElement('canvas');
//
//                     // 비디오 크기를 3으로 나누고 정수로 만듭니다.
//                     const scaledWidth = Math.floor(video.videoWidth / 3);
//                     const scaledHeight = Math.floor(video.videoHeight / 3);
//
//                     canvas.width = scaledWidth;
//                     canvas.height =scaledHeight;
//                     const offscreenCanvas = canvas.transferControlToOffscreen();
//
//                     await initWorker(scaledWidth, scaledHeight);
//
//                     // 워커에게 OffscreenCanvas 전송
//                     const worker = useWorkerStore.getState().worker;
//                     worker.postMessage({
//                         type: 'VIDEO_INIT',
//                         offscreenCanvas: offscreenCanvas,
//                         width: scaledWidth,
//                         height: scaledHeight
//                     }, [offscreenCanvas]);
//
//                     // 프레임 전송 시작
//                     isCapturingRef.current = true;
//                     sendVideoFrame(video, worker, scaledWidth, scaledHeight);
//                 };
//
//                 videoRef.current = video;
//             } catch (err) {
//                 console.error("Error accessing camera:", err);
//             }
//         };
//
//         setupVideoAndWorker();
//
//         return () => {
//             isCapturingRef.current = false;
//             if (videoStream) {
//                 videoStream.getTracks().forEach(track => track.stop());
//             }
//         };
//     }, [initWorker]);
//
//     const sendVideoFrame = useCallback((video, worker, scaledWidth, scaledHeight) => {
//         if (!isCapturingRef.current) return;
//
//         const canvas = document.createElement('canvas');
//         canvas.width = scaledWidth;
//         canvas.height = scaledHeight;
//         const ctx = canvas.getContext('2d')
//         ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
//
//         createImageBitmap(canvas).then(bitmap => {
//             worker.postMessage({ type: 'VIDEO_FRAME', bitmap }, [bitmap]);
//         });
//
//         setTimeout(() => sendVideoFrame(video, worker, scaledWidth, scaledHeight), frameInterval);
//     }, [frameInterval]);
//
//     useEffect(() => {
//         if (isInitialized) {
//             setWorkerMessageHandler((e) => {
//                 if (e.data.type === 'LANDMARKS_UPDATED') {
//                     onLandmarksUpdate(e.data);
//                 }
//             });
//         }
//     }, [isInitialized, setWorkerMessageHandler, onLandmarksUpdate]);
//
//     return videoRef;
// }