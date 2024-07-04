import { useEffect, useRef, useCallback } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { initializeDetectors } from '@/lib/mediapipe/tasksVision';

export function useMotionCapture(localVideoRef, setLandmarks) {
    const resultRef = useRef(null);
    const cameraRef = useRef(null);

    const processLandmarks = useCallback((faceResult, handResult) => {
        if (!faceResult.faceLandmarks?.[0] || !handResult.landmarks) return;

        const face = faceResult.faceLandmarks[0];
        const hands = handResult.landmarks;

        const newLandmarks = {
            nose: face[1],
            leftEye: face[159],
            rightEye: face[386],
            leftHand: hands[0] ? {
                wrist: hands[0][10],
                indexBase: hands[0][1], // 5
                pinkyBase: hands[0][17]
            } : null,
            rightHand: hands[1] ? {
                wrist: hands[1][10],
                indexBase: hands[1][1], // 5
                pinkyBase: hands[1][17]
            } : null
        };

        setLandmarks(newLandmarks);
    }, [setLandmarks]);

    const detectFrame = useCallback(async () => {
        if (!resultRef.current || !localVideoRef.current) return;

        const timestamp = performance.now();
        const faceResult = resultRef.current.faceLandmarker.detectForVideo(localVideoRef.current, timestamp);
        const handResult = resultRef.current.handLandmarker.detectForVideo(localVideoRef.current, timestamp);
        
        processLandmarks(faceResult, handResult);
    }, [processLandmarks, localVideoRef]);

    useEffect(() => {
        let isMounted = true;

        const initMediapipe = async () => {
            try {
                resultRef.current = await initializeDetectors();

                if (localVideoRef.current && isMounted) {
                    cameraRef.current = new Camera(localVideoRef.current, {
                        onFrame: detectFrame,
                        width: 320,
                        height: 240,
                        frameRate: 30
                    });

                    await cameraRef.current.start();
                }
            } catch (error) {
                console.error('Error in initMediapipe:', error);
            }
        };

        initMediapipe();

        return () => {
            isMounted = false;
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            if (resultRef.current) {
                resultRef.current = null;
            }
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [detectFrame, localVideoRef]);

    return null;
}