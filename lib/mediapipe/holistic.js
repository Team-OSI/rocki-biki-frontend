import * as Holistic from '@mediapipe/holistic'

export const HAND_PRESENCE_THRESHOLD = 0.5 // 손이 존재한다고 판단할 신뢰도 임계값
export const MAX_HAND_MOVEMENT = 0.3 // 손의 최대 허용 이동거리 (이전 프레임 대비)

export function createHolistic() {
  return new Holistic.Holistic({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675469404/${file}`;
    },
    wasmLoaderPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675469404/'
  });
}

export async function initializeHolistic(holistic) {
  try{
    await holistic.initialize()
    console.log('Holistic initialized successfully')
    holistic.setOptions({
      modelComplexity: 0.5,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    console.log('Holistic options set')
    
    return holistic
  } catch (error) {
    console.error('Error initializing Holistic: ', error);
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