"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { throttle } from "lodash";
import stringSimilarity from 'string-similarity';

const similarityThreshold = 0.60;
const voiceSimilarityThreshold = 0.60;
const SKILL_DURATION = 3;
const CANVAS_VISIBLE_DURATION = 10; 

export default function SkillCanvas(
    {
        videoElement,
        image,
        onSkillComplete,
        poseLandmarks,
        skillConfig,
        finalTranscript,
        width = 640,
        height = 480
    }) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [similarityResult, setSimilarityResult] = useState(null);
    const [remainingTime, setRemainingTime] = useState(SKILL_DURATION);
    const [remainingVisibleTime, setRemainingVisibleTime] = useState(CANVAS_VISIBLE_DURATION);
    const [isSkillActive, setIsSkillActive] = useState(false);
    const [isCanvasVisible, setIsCanvasVisible] = useState(true);
    const timerRef = useRef(null);
    const [voiceSimilarityResult, setVoiceSimilarityResult] = useState(null);
    const [poseSimilarities, setPoseSimilarities] = useState([]);

    // 타이머 시작 함수
    const startTimer = useCallback(() => {
        console.log("Starting timer"); // 로그 추가
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    onSkillComplete();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    }, [onSkillComplete]);

    // 컴포넌트 마운트 시 캔버스 가시성 타이머 시작
    useEffect(() => {
        console.log("Component mounted"); // 로그 추가
        const visibilityTimer = setInterval(() => {
            setRemainingVisibleTime((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(visibilityTimer);
                    setIsCanvasVisible(false);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(visibilityTimer);
    }, []);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // 스킬 활성화 시 타이머 시작
    useEffect(() => {
        console.log("Skill active:", isSkillActive); // 로그 추가
        if (isSkillActive && !timerRef.current) {
            startTimer();
        }
    }, [isSkillActive, startTimer]);

    // 포즈 유사도 계산 함수
    const calculatePoseSimilarity = (detectedPose, targetPose) => {
        const shoulderWidth = Math.abs(detectedPose.leftShoulder.x - detectedPose.rightShoulder.x);

        const calculateRelativeSimilarity = (detected, target, shoulder) => {
            const relativeDetected = {
                x: (detected.x - shoulder.x) / shoulderWidth,
                y: (detected.y - shoulder.y) / shoulderWidth
            };
            const dx = relativeDetected.x - target.x;
            const dy = relativeDetected.y - target.y;
            return 1 - Math.min(Math.sqrt(dx * dx + dy * dy), 1);
        };

        const similarities = [
            calculateRelativeSimilarity(detectedPose.rightWrist, targetPose.rightWrist, detectedPose.rightShoulder),
            calculateRelativeSimilarity(detectedPose.leftWrist, targetPose.leftWrist, detectedPose.leftShoulder),
            calculateRelativeSimilarity(detectedPose.rightElbow, targetPose.rightElbow, detectedPose.rightShoulder),
            calculateRelativeSimilarity(detectedPose.leftElbow, targetPose.leftElbow, detectedPose.leftShoulder),
            calculateRelativeSimilarity(detectedPose.rightIndex, targetPose.rightIndex, detectedPose.rightShoulder),
            calculateRelativeSimilarity(detectedPose.leftIndex, targetPose.leftIndex, detectedPose.leftShoulder)
        ];

        return similarities.reduce((sum, similarity) => sum + similarity, 0) / similarities.length;
    };

    // 음성 유사도 계산 함수
    const calculateVoiceSimilarity = (transcript, targetReading) => {
        if (!transcript || !targetReading) return 0;
        return stringSimilarity.compareTwoStrings(transcript, targetReading);
    };

    const skillConfigRef = useRef(skillConfig);
    useEffect(() => {
        skillConfigRef.current = skillConfig;
    }, [skillConfig]);

    // 프레임 처리 함수
    const processFrame = useCallback(() => {
        if (!canvasRef.current) {
            console.log('Canvas not available'); // 로그 추가
            return;
        }
        if (!poseLandmarks) {
            console.log('Pose landmarks not available'); // 로그 추가
            return;
        }

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        if (videoElement) {
            console.log('Drawing video element on canvas'); // 로그 추가
            canvasCtx.drawImage(videoElement, 0, 0, width, height);
        } else {
            console.log('Video element not available'); // 로그 추가
        }

        if (isSkillActive && remainingTime > 0 && image) {
            const position = skillConfigRef.current.imagePosition(poseLandmarks, width, height);
            console.log('Drawing skill image on canvas at position:', position); // 로그 추가
            canvasCtx.drawImage(image, position.x, position.y, skillConfigRef.current.imageSize.width, skillConfigRef.current.imageSize.height);
        }

        canvasCtx.restore();

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [videoElement, isSkillActive, remainingTime, image, poseLandmarks, width, height]);

    // 포즈 랜드마크 처리 및 유사도 계산
    const processPose = useCallback(
        throttle((landmarks) => {
            if (landmarks) {
                const detectedPose = {
                    leftShoulder: landmarks.leftShoulder,
                    rightShoulder: landmarks.rightShoulder,
                    leftElbow: landmarks.leftElbow,
                    rightElbow: landmarks.rightElbow,
                    leftWrist: landmarks.leftWrist,
                    rightWrist: landmarks.rightWrist,
                    leftIndex: landmarks.leftIndex,
                    rightIndex: landmarks.rightIndex
                };

                if (Object.values(detectedPose).every(landmark => landmark)) {
                    const poseSimilarity = calculatePoseSimilarity(detectedPose, skillConfig.targetPose);
                    const voiceSimilarity = calculateVoiceSimilarity(finalTranscript, skillConfig.skillReading);
                    setSimilarityResult(poseSimilarity);
                    setVoiceSimilarityResult(voiceSimilarity);
                    setIsSkillActive(poseSimilarity >= similarityThreshold && voiceSimilarity >= voiceSimilarityThreshold);

                    setPoseSimilarities(prev => [...prev, poseSimilarity]);
                } else {
                    console.log('Detected pose landmarks not available'); // 로그 추가
                }
            } else {
                console.log('Pose landmarks not available'); // 로그 추가
            }
        }, 1000), // 1000ms마다 최대 한 번 실행
        [skillConfig.targetPose, finalTranscript, skillConfig.skillReading]
    );

    useEffect(() => {
        const interval = setInterval(() => {
            processPose(poseLandmarks);
        }, 1000);

        return () => clearInterval(interval);
    }, [poseLandmarks, processPose]);

    // 10초 후 포즈 유사도 평균 계산
    useEffect(() => {
        if (remainingVisibleTime === 0 && poseSimilarities.length > 0) {
            const averagePoseSimilarity = poseSimilarities.reduce((sum, value) => sum + value, 0) / poseSimilarities.length;
            console.log("Average Pose Similarity:", averagePoseSimilarity.toFixed(2));
        }
    }, [remainingVisibleTime, poseSimilarities]);

    // 프레임 처리 시작 및 정리
    useEffect(() => {
        console.log('Starting frame processing'); // 로그 추가
        processFrame();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [processFrame]);

    if (!isCanvasVisible) {
        console.log('Canvas is not visible'); // 로그 추가
        return null;
    }

    return (
        <div className='motion-capture'>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ transform: 'scaleX(-1)' }}
            />
            <div id="canvas-timer">
                <span className='timer-value'>{remainingVisibleTime}</span>초 후에 캔버스가 사라집니다
            </div>
            <div id="skill-timer">
                <span className='timer-value'>{remainingTime}</span>초만 더 버텨라!
            </div>
            <div>
                {similarityResult !== null && (
                    <div id="similarity" style={{ color: skillConfig.textColor }}>
                        <p>Similarity: {similarityResult.toFixed(2)}</p>
                        <p>Voice Similarity: {voiceSimilarityResult?.toFixed(2)}</p>
                        {isSkillActive && remainingTime > 0 && (
                            <p>{skillConfig.activationMessage} ({skillConfig.name} Skill 발동!!)</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
