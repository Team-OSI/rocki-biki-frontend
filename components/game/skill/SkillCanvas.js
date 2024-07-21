"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { throttle } from "lodash";
import stringSimilarity from 'string-similarity';
import useSocketStore from '@/store/socketStore';

const similarityThreshold = 0.20;
const CANVAS_VISIBLE_DURATION = 5;

export default function SkillCanvas(
    {
        videoElement,
        image,
        onSkillComplete,
        poseLandmarks,
        skillConfig,
        finalTranscript,
        skillType,
        width = 640,
        height = 480
    }) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [similarityResult, setSimilarityResult] = useState(null);
    const [remainingVisibleTime, setRemainingVisibleTime] = useState(CANVAS_VISIBLE_DURATION);
    const [isSkillActive, setIsSkillActive] = useState(false);
    const [isCanvasVisible, setIsCanvasVisible] = useState(true);
    const emitUseSkill = useSocketStore(state => state.emitUseSkill);
    const [poseSimilarities, setPoseSimilarities] = useState([]);
    const [hasComputedAverage, setHasComputedAverage] = useState(false); 
    const [voiceSimilarities, setVoiceSimilarities] = useState([]);
    const [voiceSimilarityResult,setVoiceSimilarityResult] = useState(null);
    // 컴포넌트 마운트 시 캔버스 가시성 타이머 시작
    useEffect(() => {
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
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

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
        if (!canvasRef.current || !poseLandmarks) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        if (videoElement) {
            console.log('Drawing video element on canvas');
            canvasCtx.drawImage(videoElement, 0, 0, width, height);
        }

        if (isSkillActive && image) {
            console.log(1);
            const position = skillConfigRef.current.imagePosition(poseLandmarks, width, height);
            console.log('Drawing skill image on canvas at position:', position);
            canvasCtx.drawImage(image, position.x, position.y, skillConfigRef.current.imageSize.width, skillConfigRef.current.imageSize.height);
        }

        canvasCtx.restore();

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [videoElement, isSkillActive, image, poseLandmarks, width, height]);

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
                    setIsSkillActive(poseSimilarity >= similarityThreshold);

                    setPoseSimilarities(prev => [...prev, poseSimilarity]);
                    setVoiceSimilarities(prev => [...prev, voiceSimilarity]);
                }
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

    // 5초 후 포즈 유사도 평균 계산
    useEffect(() => {
        if (remainingVisibleTime === 0 && !hasComputedAverage && poseSimilarities.length > 0) {
            const averagePoseSimilarity = poseSimilarities.reduce((sum, value) => sum + value, 0) / poseSimilarities.length;
            const maxVoiceSimilarity = Math.max(...voiceSimilarities);
            const similarAverage = averagePoseSimilarity + maxVoiceSimilarity;
            console.log("Average Pose Similarity:", averagePoseSimilarity.toFixed(2));
            console.log("Total Similarity:", similarAverage.toFixed(2));
            emitUseSkill(skillType, similarAverage);
            setHasComputedAverage(true); 

            // 5초 후 NULL 값을 보내는 타이머 설정
            setTimeout(() => {
                emitUseSkill(null, null);
            }, 5000);
        }
    }, [remainingVisibleTime, poseSimilarities, voiceSimilarities, emitUseSkill, skillType, hasComputedAverage]);

    // 프레임 처리 시작 및 정리
    useEffect(() => {
        processFrame();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [processFrame]);

    if (!isCanvasVisible) return null;

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
            <div>
                {similarityResult !== null && (
                    <div id="similarity" style={{ color: skillConfig.textColor }}>
                        <p>Similarity: {similarityResult.toFixed(2)}</p>
                        <p>Voice Similarity: {voiceSimilarityResult?.toFixed(2)}</p>
                        {isSkillActive && (
                            <p>{skillConfig.activationMessage} ({skillConfig.name} Skill 발동!!)</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
