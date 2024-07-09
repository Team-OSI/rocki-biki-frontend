import { useEffect, useRef, useCallback, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { initializeDetectors, processPoseLandmarks } from '@/lib/mediapipe/tasksVision';

export function useMotionCapture(localVideoRef, setLandmarks, setPoseLandmarks) {
    const [detectors, setDetectors] = useState(null);
    const cameraRef = useRef(null);
    const prevLandmarksRef = useRef(null);
    const lastValidLandmarksRef = useRef(null);

    // initializeDetectors 호출
    useEffect(()=> {
        let isMounted = true;

        const initDetectors = async () => {
            try {
                const result = await initializeDetectors();
                if (isMounted){
                    setDetectors(result);
                }
            } catch (error) {
                console.log('Error initializeing detectors:', error);
            }
        }
        initDetectors();
        return () => {
            isMounted = false;
        }
    }, [])

    const calc_distance = useCallback((pos1, pos2) => {
        return Math.sqrt(
            (pos1[0] - pos2[0])**2 +
            (pos1[1] - pos2[1])**2 +
            (pos1[2] - pos2[2])**2
        )
    }, [])
    
    const isValidMovement = useCallback((prev, current, maxDistance) => {
        if (!prev || !current) return true;
        return calc_distance(prev, current) <=maxDistance;
    },[calc_distance]);


    const calculateHandRotation = useCallback((wrist, indexMCP, pinkyMCP, middlePIP) => {
        // 상하 회전 (pitch) 계산
        const pitchRotation = Math.atan2(middlePIP.y - wrist.y, middlePIP.x - wrist.x);
    
        // 좌우 회전 (yaw) 계산
        const handDirection = {
            x: indexMCP.x - pinkyMCP.x,
            y: indexMCP.y - pinkyMCP.y
        };
        const yawRotation = Math.atan2(handDirection.y, handDirection.x);
    
        return [pitchRotation, yawRotation];
    }, []);

    const calc_hand_center = useCallback((hand) => {
        if (!hand || !hand[5] || !hand[18]) return null;
        const index_mcp = hand[5];
        const pinky_pip = hand[18];
        return [
            (index_mcp.x + pinky_pip.x) /2,
            (index_mcp.y + pinky_pip.y) /2,
            (index_mcp.z + pinky_pip.z) /2
        ]
    }, [])


    const processLandmarks = useCallback((faceResult, handResult, poseResult) => {

        const face = faceResult.faceLandmarks?.[0] || [];
        const hands = handResult.landmarks || [];


        const calc_head_rotation_2d = (face_landmarks) => {
            // 필요한 랜드마크 포인트 (눈, 코, 입)
            const left_eye = face_landmarks[33];  // 왼쪽 눈 중심
            const right_eye = face_landmarks[263];  // 오른쪽 눈 중심

            // 눈 랜드마크가 없는 경우 기본값 반환
            if (!left_eye || !right_eye) {
                return [0, 0, 0];
            }

            const yaw = Math.atan2(right_eye.y - left_eye.y, right_eye.x - left_eye.x);
        
            // Roll (기울기) 계산
            const roll = Math.atan2(right_eye.y - left_eye.y, right_eye.x - left_eye.x);
        
            // 라디안을 도로 변환
            return [
                0 , // pitch * (180 / Math.PI),
                yaw * (180 / Math.PI),
                roll * (180 / Math.PI)
            ];
        };

        //  주먹 인지 && 주먹 방향 체크하는 함수
        const determinHandState = (hand) => {
            // 손의 모양에 따라 주먹이 아니면 0을 리턴하고 주먹이면 주먹의 방향을 표시
            // 손등이면 1, 손바닥이면 2 리턴
            if (!hand || hand.length < 21) return 0;
            const thumb_tip = hand[4];
            const index_tip = hand[8];
            const middle_tip = hand[12];
            const ring_tip = hand[16];
            const pinky_tip = hand[20];
            const wrist = hand[0];

            // 손가락 끝과 손목 사이의 거리를 계산
            const fingerDistances = [thumb_tip, index_tip, middle_tip, ring_tip, pinky_tip].map(tip => 
                Math.sqrt((tip.x - wrist.x)**2 + (tip.y - wrist.y)**2 + (tip.z - wrist.z)**2)
            );
            // 주먹을 쥐었는지 확인 (손가락 끝이 손목에 가까우면 주먹을 쥔 것으로 간주)
            const isFist = fingerDistances.every(distance => distance < 0.1); // 임계값은 조정 가능
            
            if (!isFist) return 0; // 0: 주먹이 아님

            // 주먹 방향 확인 (검지 중수골 - 손목 : Vetor3d)
            const knuckle = hand[5];
            const palmNormal = [
                knuckle.x - wrist.x,
                knuckle.y - wrist.y,
                knuckle.z - wrist.z
            ];
            // z 축과의 각도를 계산하여 손등인지 손바닥인지 판단
            const angle = Math.acos(palmNormal[2] / Math.sqrt(palmNormal[0]**2 + palmNormal[1]**2 + palmNormal[2]**2));
            
            return angle < Math.PI / 2 ? 1: 2; // 1: 손등, 2: 손바닥
        }
        // 유효성 설정
        const maxHeadMovement = 0.8 ; // 최대허용 머리 이동거리
        const maxHandMovement = 1.9; // 최대허용 손 이동거리

        // 내보낼 landmarks 값
        const newLandmarks = {
            // [position, rotation, state(hand)]
            head: face.length > 0 && face[1] ? 
                [[face[1]?.x || 0, face[1]?.y || 0, face[1]?.z || 0], calc_head_rotation_2d(face)] : 
                lastValidLandmarksRef.current?.head || [[0, 0, 0], [0, 0, 0]],
        
            leftHand: hands[0] ? [
                calc_hand_center(hands[0]) || lastValidLandmarksRef.current?.leftHand?.[0] || [0, 0, 0],
                calculateHandRotation(hands[0][0], hands[0][5], hands[0][17], hands[0][10]) || lastValidLandmarksRef.current?.leftHand?.[1] || [0, 0],
                determinHandState(hands[0]) || 0
            ] : lastValidLandmarksRef.current?.leftHand || [[0, 0, 0], [0, 0], 0],
        
            rightHand: hands[1] ? [
                calc_hand_center(hands[1]) || lastValidLandmarksRef.current?.rightHand?.[0] || [0, 0, 0],
                calculateHandRotation(hands[1][0], hands[1][5], hands[1][17], hands[1][10]) || lastValidLandmarksRef.current?.rightHand?.[1] || [0, 0],
                determinHandState(hands[1]) || 0
            ] : lastValidLandmarksRef.current?.rightHand || [[0, 0, 0], [0, 0], 0],
        };

        // 유효성 검사
        if (prevLandmarksRef.current) {
            if (newLandmarks.head[0] && prevLandmarksRef.current.head[0] &&
                !isValidMovement(prevLandmarksRef.current.head[0], newLandmarks.head[0], maxHeadMovement)) {
                newLandmarks.head = prevLandmarksRef.current.head;
            }
            if (newLandmarks.leftHand[0] && prevLandmarksRef.current.leftHand[0] &&
                !isValidMovement(prevLandmarksRef.current.leftHand[0], newLandmarks.leftHand[0], maxHandMovement)) {
                newLandmarks.leftHand = prevLandmarksRef.current.leftHand;
            }
            if (newLandmarks.rightHand[0] && prevLandmarksRef.current.rightHand[0] &&
                !isValidMovement(prevLandmarksRef.current.rightHand[0], newLandmarks.rightHand[0], maxHandMovement)) {
                newLandmarks.rightHand = prevLandmarksRef.current.rightHand;
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

        prevLandmarksRef.current = newLandmarks; // 현재 프레임의 landmarks를 저장

        lastValidLandmarksRef.current = {
            head: newLandmarks.head[0] ? newLandmarks.head : lastValidLandmarksRef.current?.head,
            leftHand: newLandmarks.leftHand[0] ? newLandmarks.leftHand : lastValidLandmarksRef.current?.leftHand,
            rightHand: newLandmarks.rightHand[0] ? newLandmarks.rightHand : lastValidLandmarksRef.current?.rightHand
        };
        setLandmarks(newLandmarks);
        // 로컬에서만 사용할 포즈 데이터
        if (poseResult.landmarks && poseResult.landmarks[0]) {
            const poseLandmarks = processPoseLandmarks(poseResult.landmarks[0]);
            setPoseLandmarks(poseLandmarks);
        }
    }, [setLandmarks, setPoseLandmarks, isValidMovement, calculateHandRotation, calc_hand_center]);
    

    const detectFrame = useCallback(async () => {
        if (!detectors || !localVideoRef.current) return;

        const timestamp = performance.now();
        const faceResult = detectors.faceLandmarker.detectForVideo(localVideoRef.current, timestamp);
        const handResult = detectors.handLandmarker.detectForVideo(localVideoRef.current, timestamp);
        const poseResult = detectors.poseLandmarker.detectForVideo(localVideoRef.current, timestamp);
        
        processLandmarks(faceResult, handResult, poseResult);
    }, [processLandmarks, localVideoRef, detectors]);

    useEffect(() => {
        if (!detectors || !localVideoRef.current) return;

        const initCamera = async () => {
                cameraRef.current = new Camera(localVideoRef.current, {
                    onFrame: detectFrame,
                    width: 320,
                    height: 240,
                    frameRate: 30
                });
                await cameraRef.current.start();
        };

        initCamera();

        return () => {
            // isMounted = false;
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
        };
    }, [detectFrame, localVideoRef]); // detectors 제거 closure로 접근가능

    return null;
}