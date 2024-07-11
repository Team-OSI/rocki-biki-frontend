"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';

const similarityThreshold = 0.70;   // 포즈 유사도 임계값
const SKILL_DURATION = 5;           // 스킬 지속 시간

export default function SkillCanvas({ 
    videoElement, 
    image,
    onSkillComplete, 
    poseLandmarks, 
    skillConfig,
    width = 640,
    height = 480
}) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [similarityResult, setSimilarityResult] = useState(null);
    const [remainingTime, setRemainingTime] = useState(SKILL_DURATION);
    const [isSkillActive, setIsSkillActive] = useState(false);
    const timerRef = useRef(null);
    // const [landmarkCoordinates, setLandmarkCoordinates] = useState({});  // 디버깅용

    // 타이머 시작 함수
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

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
    
    // 스킬 활성화 시 타이머 시작
    useEffect(() => {
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

    // 프레임 처리 함수
    const processFrame = useCallback(() => {
        if (!canvasRef.current || !poseLandmarks) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        if (videoElement) {
            canvasCtx.drawImage(videoElement, 0, 0, width, height);
        }

        if (isSkillActive && remainingTime > 0 && image) {
            const position = skillConfig.imagePosition(poseLandmarks, width, height);
            canvasCtx.drawImage(image, position.x, position.y, skillConfig.imageSize.width, skillConfig.imageSize.height);
        }

        canvasCtx.restore();

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [videoElement, isSkillActive, remainingTime, image, poseLandmarks, skillConfig, width, height]);

    // 포즈 랜드마크 처리 및 유사도 계산
    useEffect(() => {
        if (poseLandmarks) {
            const detectedPose = {
                leftShoulder: poseLandmarks.leftShoulder,
                rightShoulder: poseLandmarks.rightShoulder,
                leftElbow: poseLandmarks.leftElbow,
                rightElbow: poseLandmarks.rightElbow,
                leftWrist: poseLandmarks.leftWrist,
                rightWrist: poseLandmarks.rightWrist,
                leftIndex: poseLandmarks.leftIndex,
                rightIndex: poseLandmarks.rightIndex
            };

            if (Object.values(detectedPose).every(landmark => landmark)) {
                const poseSimilarity = calculatePoseSimilarity(detectedPose, skillConfig.targetPose);
                setSimilarityResult(poseSimilarity);
                setIsSkillActive(poseSimilarity >= similarityThreshold);
                // setLandmarkCoordinates(detectedPose);
            }
        }
    }, [poseLandmarks, skillConfig.targetPose]);

    // 프레임 처리 시작 및 정리
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
            <canvas 
                ref={canvasRef} 
                width={width} 
                height={height} 
                style={{ transform: 'scaleX(-1)' }} 
            />
            <div id="skill-timer">
                <span className='timer-value'>{remainingTime}</span>초만 더 버텨라!
            </div>
            <div>
                {similarityResult !== null && (
                    <div id="similarity" style={{ color: skillConfig.textColor }}>
                        <p>Similarity: {similarityResult.toFixed(2)}</p>
                        {isSkillActive && remainingTime > 0 && (
                            <p>{skillConfig.activationMessage} ({skillConfig.name} Skill 발동!!)</p>
                        )}
                    </div>
                )}
            </div>
            {/* <div id="landmark-coordinates" style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px' }}>
                <h3>Landmark Coordinates:</h3>
                {Object.entries(landmarkCoordinates).map(([key, value]) => (
                    <p key={key}>{key}: x: {value?.x?.toFixed(2) || 'N/A'}, y: {value?.y?.toFixed(2) || 'N/A'}</p>
                ))}
            </div> */}
        </div>
    );
}