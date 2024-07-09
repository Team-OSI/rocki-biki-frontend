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

    // 상대 좌표 (두손을 양볼에 갖다대는 포즈)
    const targetPose = useRef({
        leftElbow: { x: 0.38, y: 0.16 },    // (120, 50) -> (0.38, 0.16)
        rightElbow: { x: -0.38, y: 0.16 },  // (-120, 50) -> (-0.38, 0.16)
        leftWrist: { x: 0.06, y: -0.09 },   // (20, -30) -> (0.06, -0.09)
        rightWrist: { x: -0.06, y: -0.09 }, // (-20, -30) -> (-0.06, -0.09)
        leftIndex: { x: -0.06, y: -0.19 },  // (-20, -60) -> (-0.06, -0.19)
        rightIndex: { x: 0.06, y: -0.19 },  // (20, -60) -> (0.06, -0.19)
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

        const detectedPose = {
            nose: poseLandmarks.nose,
            leftShoulder: poseLandmarks.leftShoulder,
            rightShoulder: poseLandmarks.rightShoulder,
            leftElbow: poseLandmarks.leftElbow,
            rightElbow: poseLandmarks.rightElbow,
            leftWrist: poseLandmarks.leftWrist,
            rightWrist: poseLandmarks.rightWrist,
            leftIndex: poseLandmarks.leftIndex,
            rightIndex: poseLandmarks.rightIndex
          };
        console.log(detectedPose);
        // 모든 필요한 랜드마크가 존재하는지 확인
        if (Object.values(detectedPose).some(landmark => !landmark)) {
            console.log("Some landmarks are missing");
            canvasCtx.restore();
            return;
        }

        const poseSimilarity = calculatePoseSimilarity(detectedPose, targetPose.current);
        setSimilarityResult(poseSimilarity);
        const newIsSkillActive = poseSimilarity >= similarityThreshold;
        setIsSkillActive(newIsSkillActive);

        // 스킬이 활성화되어 있고 시간이 남아있을 때 이미지 그리기
        if (isSkillActive && remainingTime > 0 && image) {
            const imgWidth = 144; 
            const imgHeight = 81; 
            const x = detectedPose.nose.x * canvasWidth - 80;
            const y = (detectedPose.nose.y * canvasHeight - imgHeight) - 80;
            canvasCtx.drawImage(image, x, y, imgWidth, imgHeight);
        }

        canvasCtx.restore();

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [poseLandmarks, isSkillActive, remainingTime, image, backgroundImage, videoElement, targetPose]);

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
                    <div id="similarity" style={{ color: 'plum' }}>
                        <p>Similarity: {similarityResult.toFixed(2)}</p>
                        {isSkillActive && remainingTime > 0 && (
                            <p>깜찍~(ゝω´･)b⌒☆ (Heal Skill 발동!!)</p>)}
                    </div>
                )}
            </div>
        </div>
    );
}