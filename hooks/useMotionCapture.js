import { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { initializeDetectors, processPoseLandmarks } from '@/lib/mediapipe/tasksVision';
import { isValidMovement, calculateHandRotation, calc_hand_center, determineHandState, calc_head_rotation_2d } from '@/lib/utils/motionUtils';

function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
function interpolateMotion(prevLandmark, nextLandmark, t) {
return [
    lerp(prevLandmark[0], nextLandmark[0], t),
    lerp(prevLandmark[1], nextLandmark[1], t),
    lerp(prevLandmark[2], nextLandmark[2], t),
];
}

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
    
    const frameCountRef = useRef(0);
    const lastRealLandmarksRef = useRef(null);

    useEffect(() => {
        detectFrameRef.current = async () => {

            if (!detectors || !localVideoRef.current) return;

            frameCountRef.current += 1;
            if (frameCountRef.current % 2 === 0 ){
                // 실제 모션 캡처 수행 (30fps)
                const timestamp = performance.now();
                const faceResult = detectors.faceLandmarker.detectForVideo(localVideoRef.current, timestamp);
                const handResult = detectors.handLandmarker.detectForVideo(localVideoRef.current, timestamp);
                const poseResult = detectors.poseLandmarker.detectForVideo(localVideoRef.current, timestamp);

                const {updatedLandmarks, updatedPoseLandmarks, newPrevLandmarks, newLastValidLandmarks} =
                    processLandmarks(faceResult, handResult, poseResult, prevLandmarksRef.current, lastValidLandmarksRef.current);
    
                prevLandmarksRef.current = newPrevLandmarks;
                lastValidLandmarksRef.current = newLastValidLandmarks;
                lastRealLandmarksRef.current = updatedLandmarks;

                onLandmarksUpdate({
                    landmarks: updatedLandmarks,
                    poseLandmarks: updatedPoseLandmarks
                });
            } else {
                // 중간 프레임 보간 (60fps 중 나머지 30fps)
                const t = frameCountRef.current / 2
                if (lastRealLandmarksRef.current && prevLandmarksRef.current) {
                    const interpolatedLandmarks = {
                        head: [
                            interpolateMotion(prevLandmarksRef.current.head[0], lastRealLandmarksRef.current.head[0],t),
                            interpolateMotion(prevLandmarksRef.current.head[1], lastRealLandmarksRef.current.head[1], t)
                        ],
                        leftHand: [
                            interpolateMotion(prevLandmarksRef.current.leftHand[0], lastRealLandmarksRef.current.leftHand[0], t),
                            interpolateMotion(prevLandmarksRef.current.leftHand[1], lastRealLandmarksRef.current.leftHand[1], t),
                            prevLandmarksRef.current.leftHand[2] // 손 상태는 보간x
                        ],
                        rightHand: [
                            interpolateMotion(prevLandmarksRef.current.rightHand[0], lastRealLandmarksRef.current.rightHand[0], t),
                            interpolateMotion(prevLandmarksRef.current.rightHand[1], lastRealLandmarksRef.current.rightHand[1], t),
                            prevLandmarksRef.current.rightHand[2] // 손 상태는 보간x
                        ]
                    };
                    onLandmarksUpdate({
                        landmarks: interpolatedLandmarks,
                        poseLandmarks: null // 포즈 랜드마크 보간 x
                    });
                }
            };
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
                frameRate: 44
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