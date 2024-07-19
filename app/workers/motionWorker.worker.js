import { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { processLandmarks } from "./landmarkUtils";

let faceLandmarker, handLandmarker, poseLandmarker;
let prevLandmarks, lastValidLandmarks, lastProcessedLandmarks = null;
let isInitialized = false;
let sharedArray, videoArray;
let videoWidth, videoHeight;
let imageData, regularArray = null;

let lastProcessTime = 0;
const frameInterval = 1000 / 30;

async function initializeDetectors() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.3,
        minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputFacialTransformationMatrixes: true
    });

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.3,
        minHandPresenceConfidence: 0.3,
        minTrackingConfidence: 0.3
    });

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
}

self.onmessage = async function(e) {
    if (e.data.type === 'INIT') {
        sharedArray = new Float32Array(e.data.sharedBuffer);
        videoArray = new Uint8ClampedArray(e.data.videoBuffer);
        videoWidth = e.data.width;
        videoHeight = e.data.height;
        await initializeDetectors();
        isInitialized = true;
        self.postMessage({type: 'INIT_COMPLETE'});
    } else if (e.data.type === 'FRAME_READY') {
        const currentTime = performance.now();
        if (currentTime - lastProcessTime >= frameInterval) {
            processVideoFrame(e.data.startTime);
            lastProcessTime = currentTime;
        } else {
            interpolateLandmarks(currentTime);
        }
    }
};

function flatResult(result) {
    // result 객체를 1차원 Float32Array로 변환
    const flattened = [1];

    // updatedLandmarks 처리
    for (const key in result.updatedLandmarks) {
        const landmark = result.updatedLandmarks[key];
        flattened.push(...landmark[0], ...landmark[1], landmark[2]);
    }

    // updatedPoseLandmarks 처리
    if (result.updatedPoseLandmarks) {
        flattened.push(1);
        for (const key in result.updatedPoseLandmarks) {
            const poseLandmark = result.updatedPoseLandmarks[key];
            flattened.push(poseLandmark.x, poseLandmark.y, poseLandmark.z);
        }
    }
    return new Float32Array(flattened);
}

function linearInterpolate(y1, y2, mu) {
    return y1 * (1 - mu) + y2 * mu;
}

function interpolate(lastLandmarks, factor) {
    const interpolatedResult = {
        updatedLandmarks: {},
        updatedPoseLandmarks: lastLandmarks.updatedPoseLandmarks
    };

    const keysToInterpolate = ['head', 'leftHand', 'rightHand'];

    for (const key of keysToInterpolate) {
        if (lastLandmarks.updatedLandmarks[key] && prevLandmarks && prevLandmarks.updatedLandmarks[key]) {
            const lastLandmark = lastLandmarks.updatedLandmarks[key];
            const prevLandmark = prevLandmarks.updatedLandmarks[key];

            interpolatedResult.updatedLandmarks[key] = [
                lastLandmark[0].map((v, i) => linearInterpolate(prevLandmark[0][i], v, factor)),
                lastLandmark[1].map((v, i) => linearInterpolate(prevLandmark[1][i], v, factor)),
                lastLandmark[2]
            ];
        } else {
            interpolatedResult.updatedLandmarks[key] = lastLandmarks.updatedLandmarks[key];
        }
    }

    return interpolatedResult;
}

function interpolateLandmarks(currentTime) {
    if (!lastProcessedLandmarks) return;

    const timeSinceLastProcess = currentTime - lastProcessTime;
    const interpolationFactor = Math.min(timeSinceLastProcess / frameInterval, 1);

    const interpolatedResult = interpolate(lastProcessedLandmarks, interpolationFactor);
    const flattenResult = flatResult(interpolatedResult);
    sharedArray.set(flattenResult);

    self.postMessage({
        type: 'LANDMARKS_UPDATED',
        resultOffset: 1,
        resultLength: flattenResult.length,
    });
}

function processVideoFrame(startTime) {
    if (!isInitialized) return;

    if (!imageData || !regularArray || imageData.width !== videoWidth || imageData.height !== videoHeight) {
        // 필요한 경우에만 새 ImageData, VideoArray 생성
        regularArray = new Uint8ClampedArray(videoArray.length);
        imageData = new ImageData(regularArray, videoWidth, videoHeight);
    }
    // 공유 버퍼의 데이터를 일반 버퍼로 복사 후 imageData에 세팅
    regularArray.set(videoArray);
    imageData.data.set(regularArray);

    const timestamp = performance.now();
    const faceResult = faceLandmarker.detectForVideo(imageData, timestamp);
    const handResult = handLandmarker.detectForVideo(imageData, timestamp);
    const poseResult = poseLandmarker.detectForVideo(imageData, timestamp);

    const result = processLandmarks(faceResult, handResult, poseResult, prevLandmarks, lastValidLandmarks);
    lastProcessedLandmarks = result;
    const flattenResult = flatResult(result);
    sharedArray.set(flattenResult);

    prevLandmarks = result.newPrevLandmarks;
    lastValidLandmarks = result.newLastValidLandmarks;

    self.postMessage({
        type: 'LANDMARKS_UPDATED',
        resultOffset: 1,
        resultLength: flattenResult.length,
    });
}
