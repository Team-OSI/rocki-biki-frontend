// import { KalmanFilter2D } from './kalmanFilter.js';
//
// const headFilter = new KalmanFilter2D();
// const leftHandFilter = new KalmanFilter2D();
// const rightHandFilter = new KalmanFilter2D();

let frameCount = 0;
const LOG_INTERVAL = 60;

export function processLandmarks(faceResult, handResult, poseResult, prevLandmarks, lastValidLandmarks) {
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
    }
}

const processPoseLandmarks = (poseLandmarks) => {
    if (!poseLandmarks || poseLandmarks.length === 0) {
        return null;
    }

    return {
        nose: poseLandmarks[0],
        rightEye: poseLandmarks[2],
        leftShoulder: poseLandmarks[11],
        rightShoulder: poseLandmarks[12],
        leftElbow: poseLandmarks[13],
        rightElbow: poseLandmarks[14],
        leftWrist: poseLandmarks[15],
        rightWrist: poseLandmarks[16],
        leftIndex: poseLandmarks[19],
        rightIndex: poseLandmarks[20]
    };
}

const calc_head_rotation_2d = (face_landmarks) => {
    const left_eye = face_landmarks[33];
    const right_eye = face_landmarks[263];

    if (!left_eye || !right_eye) {
        return [0, 0, 0];
    }

    const yaw = Math.atan2(right_eye.y - left_eye.y, right_eye.x - left_eye.x);
    const roll = Math.atan2(right_eye.y - left_eye.y, right_eye.x - left_eye.x);

    return [
        0,
        yaw * (180 / Math.PI),
        roll * (180 / Math.PI)
    ];
};

const calc_distance = (pos1, pos2) => {
    return Math.sqrt(
        (pos1[0] - pos2[0])**2 +
        (pos1[1] - pos2[1])**2 +
        (pos1[2] - pos2[2])**2
    );
};

const isValidMovement = (prev, current, maxDistance) => {
    if (!prev || !current) return true;
    return calc_distance(prev, current) <= maxDistance;
};

const calculateHandRotation = (wrist, indexMCP, pinkyMCP, middlePIP) => {
    const pitchRotation = Math.atan2(middlePIP.y - wrist.y, middlePIP.x - wrist.x);

    const handDirection = {
        x: indexMCP.x - pinkyMCP.x,
        y: indexMCP.y - pinkyMCP.y
    };
    const yawRotation = Math.atan2(handDirection.y, handDirection.x);

    return [pitchRotation, yawRotation];
};

const calc_hand_center = (hand) => {
    if (!hand || !hand[5] || !hand[18]) return null;
    const index_mcp = hand[5];
    const pinky_pip = hand[18];
    return [
        (index_mcp.x + pinky_pip.x) / 2,
        (index_mcp.y + pinky_pip.y) / 2,
        (index_mcp.z + pinky_pip.z) / 2
    ];
};

const determineHandState = (hand) => {
    if (!hand || hand.length < 21) return 0;
    const thumb_tip = hand[4];
    const index_tip = hand[8];
    const middle_tip = hand[12];
    const ring_tip = hand[16];
    const pinky_tip = hand[20];
    const wrist = hand[0];

    const fingerDistances = [thumb_tip, index_tip, middle_tip, ring_tip, pinky_tip].map(tip =>
        Math.sqrt((tip.x - wrist.x)**2 + (tip.y - wrist.y)**2 + (tip.z - wrist.z)**2)
    );
    const isFist = fingerDistances.every(distance => distance < 0.1);

    if (!isFist) return 0;

    const knuckle = hand[5];
    const palmNormal = [
        knuckle.x - wrist.x,
        knuckle.y - wrist.y,
        knuckle.z - wrist.z
    ];
    const angle = Math.acos(palmNormal[2] / Math.sqrt(palmNormal[0]**2 + palmNormal[1]**2 + palmNormal[2]**2));

    return angle < Math.PI / 2 ? 1 : 2;
};
