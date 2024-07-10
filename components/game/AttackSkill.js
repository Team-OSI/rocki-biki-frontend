"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';

const similarityThreshold = 0.65;
const SKILL_DURATION = 5;

export default function HealSkill({ videoElement, image, backgroundImage, onSkillComplete, poseLandmarks }) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [similarityResult, setSimilarityResult] = useState(null);
    const [remainingTime, setRemainingTime] = useState(SKILL_DURATION);
    const [isSkillActive, setIsSkillActive] = useState(false);
    const timerRef = useRef(null);
    const [landmarkCoordinates, setLandmarkCoordinates] = useState({});

    // 상대 좌표 (흑염룡 포즈)
    const targetPose = useRef({
        leftElbow: { x: -0.04, y: 1.26 },
        rightElbow: { x: -0.04, y: 0.93 },
        leftWrist: { x: -0.78, y: 1.00 },
        rightWrist: { x: 0.48, y: -0.04 },
        leftIndex: { x: -0.93, y: 0.81 },
        rightIndex: { x: 0.59, y: -0.37 },
    });

    const startTimer = useCallback(() => {
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

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
    
    useEffect(() => {
        if (isSkillActive && !timerRef.current) {
            startTimer();
        }
    }, [isSkillActive, startTimer]);

    const calculatePoseSimilarity = (detectedPose, targetPose) => {
        const shoulderWidth = Math.abs(detectedPose.leftShoulder.x - detectedPose.rightShoulder.x);
        
        const calculateRelativeSimilarity = (detected, target, shoulder) => {
            const relativeDetected = {
                x: (detected.x - shoulder.x) / shoulderWidth,
                y: (detected.y - shoulder.y) / shoulderWidth
            };
            const dx = relativeDetected.x - target.x;
            const dy = relativeDetected.y - target.y;
            return 1 - Math.min(Math.sqrt(dx*dx + dy*dy), 1);
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

    const processFrame = useCallback(() => {
        if (!canvasRef.current || !poseLandmarks) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // 배경 이미지 그리기
        if (backgroundImage) {
            canvasCtx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
        } else {
            canvasCtx.fillStyle = 'black';
            canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // 비디오 요소 그리기
        if (videoElement) {
            canvasCtx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight);
        }

        // 스킬이 활성화되어 있고 시간이 남아있을 때 이미지 그리기
        if (isSkillActive && remainingTime > 0 && image) {
            const imgWidth = 45; 
            const imgHeight = 61; 
            const x = poseLandmarks.rightEye.x * canvasWidth - 60;
            const y = (poseLandmarks.rightEye.y * canvasHeight - imgHeight) + 60;
            canvasCtx.drawImage(image, x, y, imgWidth, imgHeight);
        }

        canvasCtx.restore();

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [poseLandmarks, isSkillActive, remainingTime, image, backgroundImage, videoElement]);

    useEffect(() => {
        if (poseLandmarks) {
            const detectedPose = {
                rightEye: poseLandmarks.rightEye,
                leftShoulder: poseLandmarks.leftShoulder,
                rightShoulder: poseLandmarks.rightShoulder,
                leftElbow: poseLandmarks.leftElbow,
                rightElbow: poseLandmarks.rightElbow,
                leftWrist: poseLandmarks.leftWrist,
                rightWrist: poseLandmarks.rightWrist,
                leftIndex: poseLandmarks.leftIndex,
                rightIndex: poseLandmarks.rightIndex
            };
        
            // 모든 필요한 랜드마크가 존재하는지 확인
            if (Object.values(detectedPose).every(landmark => landmark)) {
                const poseSimilarity = calculatePoseSimilarity(detectedPose, targetPose.current);
                setSimilarityResult(poseSimilarity);
                setIsSkillActive(poseSimilarity >= similarityThreshold);
                setLandmarkCoordinates(detectedPose);  // 랜드마크 좌표 저장
            }
        }
    }, [poseLandmarks, targetPose]);

    useEffect(() => {
        processFrame();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [processFrame]);

    return (
        <div className='motion-capture'>
            <canvas id="landmarks" ref={canvasRef} width="640" height="480" style={{ transform:'scaleX(-1)' }} />
            <div id="skill-timer">
                <span className='timer-value'>{remainingTime}</span>초만 더 버텨라!
            </div>
            <div>
                {similarityResult !== null && (
                    <div id="similarity" style={{ color: 'gray' }}>
                        <p>Similarity: {similarityResult.toFixed(2)}</p>
                        {isSkillActive && remainingTime > 0 && (
                            <p>시시해서 죽고 싶어졌다..(ʘ言ʘ╬) (Attack Skill 발동!!)</p>)}
                    </div>
                )}
            </div>
            <div id="landmark-coordinates" style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px' }}>
                <h3>Landmark Coordinates:</h3>
                {Object.entries(landmarkCoordinates).map(([key, value]) => (
                    <p key={key}>{key}: x: {value?.x?.toFixed(2) || 'N/A'}, y: {value?.y?.toFixed(2) || 'N/A'}</p>
                ))}
            </div>
        </div>
    );
}