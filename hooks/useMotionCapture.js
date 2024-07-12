import { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { initializeDetectors, processPoseLandmarks } from '@/lib/mediapipe/tasksVision';
import { isValidMovement, calculateHandRotation, calc_hand_center, determineHandState, calc_head_rotation_2d } from '@/lib/utils/motionUtils';

const processLandmarks = (faceResult, handResult, poseResult, prevLandmarks, lastValidLandmarks) => {
    const face = faceResult.faceLandmarks?.[0] || [];
    const hands = handResult.landmarks || [];

    const maxHeadMovement = 0.8;
    const maxHandMovement = 2.9;

    const newLandmarks = {
        head: face.length > 0 && face[1] ?
            [[face[1]?.x || 0, face[1]?.y || 0, face[1]?.z || 0], calc_head_rotation_2d(face)] :
            lastValidLandmarks?.head || [[0, 0, 0], [0, 0, 0]],

        leftHand: hands[0] ? [
            calc_hand_center(hands[0]) || lastValidLandmarks?.leftHand?.[0] || [0, 0, 0],
            calculateHandRotation(hands[0][0], hands[0][5], hands[0][17], hands[0][10]) || lastValidLandmarks?.leftHand?.[1] || [0, 0],
            determineHandState(hands[0]) || 0
        ] : lastValidLandmarks?.leftHand || [[0, 0, 0], [0, 0], 0],

        rightHand: hands[1] ? [
            calc_hand_center(hands[1]) || lastValidLandmarks?.rightHand?.[0] || [0, 0, 0],
            calculateHandRotation(hands[1][0], hands[1][5], hands[1][17], hands[1][10]) || lastValidLandmarks?.rightHand?.[1] || [0, 0],
            determineHandState(hands[1]) || 0
        ] : lastValidLandmarks?.rightHand || [[0, 0, 0], [0, 0], 0],
    };

    // 유효성 검사
    if (prevLandmarks) {
        if (newLandmarks.head[0] && prevLandmarks.head[0] &&
            !isValidMovement(prevLandmarks.head[0], newLandmarks.head[0], maxHeadMovement)) {
            newLandmarks.head = prevLandmarks.head;
        }
        if (newLandmarks.leftHand[0] && prevLandmarks.leftHand[0] &&
            !isValidMovement(prevLandmarks.leftHand[0], newLandmarks.leftHand[0], maxHandMovement)) {
            newLandmarks.leftHand = prevLandmarks.leftHand;
        }
        if (newLandmarks.rightHand[0] && prevLandmarks.rightHand[0] &&
            !isValidMovement(prevLandmarks.rightHand[0], newLandmarks.rightHand[0], maxHandMovement)) {
            newLandmarks.rightHand = prevLandmarks.rightHand;
        }
    }

    // 손의 위치에 따라 왼손/오른손 재할당
    if (newLandmarks.leftHand[0] && newLandmarks.rightHand[0]) {
        if (newLandmarks.leftHand[0][0] < newLandmarks.rightHand[0][0]) {
            [newLandmarks.leftHand, newLandmarks.rightHand] = [newLandmarks.rightHand, newLandmarks.leftHand];
        }
    } else if (newLandmarks.leftHand[0] || newLandmarks.rightHand[0]) {
        const hand = newLandmarks.leftHand[0] || newLandmarks.rightHand[0];
        if (hand[0] < 0.5) {
            newLandmarks.rightHand = newLandmarks.leftHand[0] ? newLandmarks.leftHand : [hand, [0, 0], 0];
            newLandmarks.leftHand = [null, null, null];
        } else {
            newLandmarks.leftHand = newLandmarks.rightHand[0] ? newLandmarks.rightHand : [hand, [0, 0], 0];
            newLandmarks.rightHand = [null, null, null];
        }
    }

    return {
        updatedLandmarks: newLandmarks,
        updatedPoseLandmarks: poseResult.landmarks && poseResult.landmarks[0]
            ? processPoseLandmarks(poseResult.landmarks[0])
            : null,
        newPrevLandmarks: newLandmarks,
        newLastValidLandmarks: {
            head: newLandmarks.head[0] ? newLandmarks.head : lastValidLandmarks?.head,
            leftHand: newLandmarks.leftHand[0] ? newLandmarks.leftHand : lastValidLandmarks?.leftHand,
            rightHand: newLandmarks.rightHand[0] ? newLandmarks.rightHand : lastValidLandmarks?.rightHand
        }
    };
};

export function useMotionCapture(localVideoRef, onLandmarksUpdate) {
    const [detectors, setDetectors] = useState(null);
    const cameraRef = useRef(null);
    const prevLandmarksRef = useRef(null);
    const lastValidLandmarksRef = useRef(null);

    const detectFrameRef = useRef(null);

    useEffect(() => {
        detectFrameRef.current = async () => {
            if (!detectors || !localVideoRef.current) return;

            const timestamp = performance.now();
            const faceResult = detectors.faceLandmarker.detectForVideo(localVideoRef.current, timestamp);
            const handResult = detectors.handLandmarker.detectForVideo(localVideoRef.current, timestamp);
            const poseResult = detectors.poseLandmarker.detectForVideo(localVideoRef.current, timestamp);

            const {updatedLandmarks, updatedPoseLandmarks, newPrevLandmarks, newLastValidLandmarks} =
                processLandmarks(faceResult, handResult, poseResult, prevLandmarksRef.current, lastValidLandmarksRef.current);

            prevLandmarksRef.current = newPrevLandmarks;
            lastValidLandmarksRef.current = newLastValidLandmarks;

            onLandmarksUpdate({
                landmarks: updatedLandmarks,
                poseLandmarks: updatedPoseLandmarks
            });
        };
    }, [detectors, localVideoRef, onLandmarksUpdate]);

    useEffect(() => {
        let isMounted = true;

        const initDetectors = async () => {
            try {
                const result = await initializeDetectors();
                if (isMounted) {
                    setDetectors(result);
                }
            } catch (error) {
                console.log('Error initializing detectors:', error);
            }
        };

        initDetectors();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!detectors || !localVideoRef.current) return;

        const initCamera = async () => {
            cameraRef.current = new Camera(localVideoRef.current, {
                onFrame: () => detectFrameRef.current(),
                width: 448,
                height: 336,
                frameRate: 20
            });
            await cameraRef.current.start();
        };

        initCamera();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
        };
    }, [detectors, localVideoRef]);

    return null;
}