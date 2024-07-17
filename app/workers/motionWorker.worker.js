import { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { processLandmarks } from "./landmarkUtils";

let faceLandmarker, handLandmarker, poseLandmarker;
let isInitialized = false;
let offscreenCanvas, offscreenCtx, sharedArray;
let videoWidth, videoHeight;
let lastProcessTime = 0;
const frameInterval = 1000 / 10;

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
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFacialTransformationMatrixes: true
    });

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
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

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
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
    console.log('mediapipe 로드 완료~~~~!!');
}

self.onmessage = async function(e) {
    if (e.data.type === 'INIT') {
        sharedArray = new Float32Array(e.data.sharedBuffer);
        await initializeDetectors();
        isInitialized = true;
        self.postMessage({type: 'INIT_COMPLETE'});
        console.log('워커 초기화 성공!!');
    } else if (e.data.type === 'VIDEO_INIT') {
        offscreenCanvas = e.data.offscreenCanvas;
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        videoWidth = e.data.width;
        videoHeight = e.data.height;
    } else if (e.data.type === 'VIDEO_FRAME') {
        const currentTime = performance.now();
        if (currentTime - lastProcessTime >= frameInterval) {
            processVideoFrame(e.data.imageData);
            lastProcessTime = currentTime;
        }
    }
};

function flatResult(result) {
    // result 객체를 1차원 Float32Array로 변환
    const flattened = [0];

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

let frameCount = 0;
const LOG_INTERVAL = 60;

function processVideoFrame(imageData) {
    if (!isInitialized) return;

    offscreenCtx.putImageData(imageData, 0, 0);
    const timestamp = performance.now();
    const faceResult = faceLandmarker.detectForVideo(offscreenCanvas, timestamp);
    const handResult = handLandmarker.detectForVideo(offscreenCanvas, timestamp);
    const poseResult = poseLandmarker.detectForVideo(offscreenCanvas, timestamp);

    const result = processLandmarks(faceResult, handResult, poseResult);
    const flattenResult = flatResult(result);
    sharedArray.set(flattenResult);

    self.postMessage({
        type: 'LANDMARKS_UPDATED',
        resultOffset: 1,
        resultLength: flattenResult.length
    });
}

