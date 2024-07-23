export const attackSkill = {
    name: "Attack",
    targetPose: {
        leftElbow: { x: -0.04, y: 1.26 },
        rightElbow: { x: -0.04, y: 0.93 },
        leftWrist: { x: -0.78, y: 1.00 },
        rightWrist: { x: 0.48, y: -0.04 },
        leftIndex: { x: -0.93, y: 0.81 },
        rightIndex: { x: 0.59, y: -0.37 },
    },
    imagePosition: (landmarks, width, height) => ({
        x: landmarks.rightEye.x * width - 60,
        y: (landmarks.rightEye.y * height - 61) + 60,
    }),
    imageSize: { width: 45, height: 61 },
    activationMessage: "시시해서 죽고 싶어졌다..(ʘ言ʘ╬)",
    skillReading: ["시시해서 죽고 싶어졌다", "꿇어라 이것이 너와 나의 눈높이다", "여의 존명을 부르는 것을 이번만 특별히 허하마 여의 이름은 머전드래곤이다"],
    textColor: "gray"
};

export const healSkill = {
    name: "Heal",
    targetPose: {
        leftElbow: { x: 0.60, y: -0.30 },
        rightElbow: { x: -0.60, y: -0.30 },
        leftWrist: { x: 0.11, y: -0.30 },
        rightWrist: { x: 0.06, y: -0.31 },
        leftIndex: { x: -0.09, y: -0.37 },
        rightIndex: { x: 0.23, y: -0.39 },
    },
    imagePosition: (landmarks, width, height) => ({
        x: landmarks.nose.x * width - 80,
        y: (landmarks.nose.y * height - 81) - 80,
    }),
    imageSize: { width: 144, height: 81 },
    activationMessage: "우웅 나 떄릴꼬야?~(ゝω´･)b⌒☆",
    skillReading: ["설마 나 때릴꼬야", "너무 아픈뎅 아픈거 너무 싫엉", "나 너무 아팡 호 해줭"],
    textColor: "plum"
};

export const shieldSkill = {
    name: "Shield",
    targetPose: {
        leftElbow: { x: 0.56, y: -0.69 },
        rightElbow: { x: -0.63, y: -0.41 },
        leftWrist: { x: 0.03, y: -1.44 },
        rightWrist: { x: -0.09, y: -1.31 },
        leftIndex: { x: -0.13, y: -1.53 },
        rightIndex: { x: 0.09, y: -1.47 },
    },
    imagePosition: (landmarks, width, height) => ({
        x: (width - 400) / 2,
        y: (height - 400) / 2,
    }),
    imageSize: { width: 400, height: 400 },
    activationMessage: "내 마음을 담은 하트~⎝⎛♥‿♥⎞⎠",
    skillReading: ["시켜줘 너만을 위한 명예소방관", "너 착할 줄 알았는데 안착하네 내 마음속에 안착", " 너 유모차지 왜 날 자꾸 애태워"],
    textColor: "yellowgreen"
};
 