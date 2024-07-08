import { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

export const HAND_PRESENCE_THRESHOLD = 0.5 // 손이 존재한다고 판단할 신뢰도 임계값
export const MAX_HAND_MOVEMENT = 0.3 // 손의 최대 허용 이동거리 (이전 프레임 대비)
export const MAX_HEAD_MOVEMENT = 0.3 // 머리의 최대 허용 이동거리 (이전 프레임 대비)

// tasks-vision 초기화 부분 (useMotionCapture.js에서 초기화)
export async function initializeDetectors() {
  try{
    const vision  = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFacialTransformationMatrixes: true
    });

    const handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    console.log('핸드, 손 랜드마커 로드완료~~~~~~!!');

    return { faceLandmarker, handLandmarker, poseLandmarker }
  } catch (error) {
    console.error('Error initializing task-vision: ', error);
    throw error;
  }
}

export const processHandLandmarks = (handLandmarks, handType, previousLandmarks) => {
  if (!handLandmarks || handLandmarks.length === 0 || handLandmarks[0].visibility < HAND_PRESENCE_THRESHOLD) {
      return null
  }

  const newHand = {
      wrist: handLandmarks[9],
      indexBase: handLandmarks[5],
      pinkyBase: handLandmarks[17]
  }

  const previousHand = previousLandmarks.current[handType]

  if (!previousHand || isHandMovementValid(previousHand, newHand)) {
    previousLandmarks.current[handType] = newHand;  // 현재 데이터를 이전 데이터로 업데이트
    return newHand;
  }

  return previousHand;  // 움직임이 유효하지 않으면 이전 프레임의 데이터 반환
}

export function isHandMovementValid(prevHand, newHand) {
  if (!prevHand || !newHand) return false;

  const isValidCoord = (coord) => 
    coord && typeof coord.x === 'number' && 
    typeof coord.y === 'number' && 
    typeof coord.z === 'number';

  if (!isValidCoord(prevHand.wrist) || !isValidCoord(newHand.wrist)) {
    return false;
  }

  const dx = prevHand.wrist.x - newHand.wrist.x;
  const dy = prevHand.wrist.y - newHand.wrist.y;
  const dz = prevHand.wrist.z - newHand.wrist.z;
  const distanceSquared = dx*dx + dy*dy + dz*dz;

  return distanceSquared <= MAX_HAND_MOVEMENT * MAX_HAND_MOVEMENT;
}

export const processPoseLandmarks = (poseLandmarks) => {
  if (!poseLandmarks || poseLandmarks.length === 0) {
    return null;
  }

  return {
    leftShoulder: poseLandmarks[11],
    rightShoulder: poseLandmarks[12]
  };
}