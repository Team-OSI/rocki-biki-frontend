export const calc_head_rotation_2d = (face_landmarks) => {
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

export const calc_distance = (pos1, pos2) => {
    return Math.sqrt(
        (pos1[0] - pos2[0])**2 +
        (pos1[1] - pos2[1])**2 +
        (pos1[2] - pos2[2])**2
    );
};

export const isValidMovement = (prev, current, maxDistance) => {
    if (!prev || !current) return true;
    return calc_distance(prev, current) <= maxDistance;
};

export const calculateHandRotation = (wrist, indexMCP, pinkyMCP, middlePIP) => {
    const pitchRotation = Math.atan2(middlePIP.y - wrist.y, middlePIP.x - wrist.x);

    const handDirection = {
        x: indexMCP.x - pinkyMCP.x,
        y: indexMCP.y - pinkyMCP.y
    };
    const yawRotation = Math.atan2(handDirection.y, handDirection.x);

    return [pitchRotation, yawRotation];
};

export const calc_hand_center = (hand) => {
    if (!hand || !hand[5] || !hand[18]) return null;
    const index_mcp = hand[5];
    const pinky_pip = hand[18];
    return [
        (index_mcp.x + pinky_pip.x) / 2,
        (index_mcp.y + pinky_pip.y) / 2,
        (index_mcp.z + pinky_pip.z) / 2
    ];
};

export const determineHandState = (hand) => {
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