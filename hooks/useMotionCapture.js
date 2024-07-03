import { useEffect, useRef } from 'react';
import * as cam from '@mediapipe/camera_utils';
import {
    createHolistic,
    initializeHolistic,
    processHandLandmarks
} from '@/lib/mediapipe/holistic';

export function useMotionCapture(videoRef, setLandmarks) {
    const holisticRef = useRef(null);
    const previousLandmarks = useRef({ leftHand: null, rightHand: null });

    useEffect(() => {
        let isMounted = true;

        const initHolistic = async () => {
            holisticRef.current = createHolistic();
            await initializeHolistic(holisticRef.current);

            holisticRef.current.onResults((results) => {
                if (isMounted) {
                    const newLandmarks = {
                        nose: results.faceLandmarks ? results.faceLandmarks[4] : null,
                        leftEye: results.faceLandmarks ? results.faceLandmarks[33] : null,
                        rightEye: results.faceLandmarks ? results.faceLandmarks[263] : null,
                        leftHand: processHandLandmarks(results.leftHandLandmarks, 'leftHand', previousLandmarks),
                        rightHand: processHandLandmarks(results.rightHandLandmarks, 'rightHand', previousLandmarks)
                    };

                    setLandmarks(newLandmarks);
                    previousLandmarks.current = {
                        leftHand: newLandmarks.leftHand,
                        rightHand: newLandmarks.rightHand
                    };
                }
            });

            if (videoRef.current) {
                const camera = new cam.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (isMounted && holisticRef.current) {
                            await holisticRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480
                });

                camera.start().catch((error) => {
                    console.error('Failed to start camera:', error);
                });
            }
        };

        initHolistic();

        return () => {
            isMounted = false;
            if (holisticRef.current) {
                holisticRef.current.close();
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [videoRef, setLandmarks]);
}
