'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function ReadyCanvas({ onReady, landmarks, canvasSize }) {
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const [similarityResult, setSimilarityResult] = useState(null);
  const [isReadyPose, setIsReadyPose] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5);
  const keypoints = useMemo(() => ['nose', 'leftShoulder', 'rightShoulder'], []);
  const similarityThreshold = 0.20;

  const targetPose = useRef({
    nose: { x: 0.5, y: 0.45 },
    leftShoulder: { x: 0.7, y: 0.65 },
    rightShoulder: { x: 0.3, y: 0.65 }
  });

  const extractRequiredLandmarks = useCallback((landmarks) => {
    const requiredLandmarks = {};
    for (const keypoint of keypoints) {
      if (landmarks && landmarks[keypoint]) {
        requiredLandmarks[keypoint] = landmarks[keypoint];
      }
    }
    return requiredLandmarks;
  }, [keypoints]);

  const calculatePoseSimilarity = useCallback((detectedPose, targetPose) => {
    let totalDistance = 0;
    let count = 0;

    for (const keypoint of keypoints) {
      if (detectedPose[keypoint] && targetPose[keypoint] && detectedPose[keypoint] !== null) {
        const dx = detectedPose[keypoint].x - targetPose[keypoint].x;
        const dy = detectedPose[keypoint].y - targetPose[keypoint].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalDistance += distance;
        count++;
      }
    }

    if (count === 0) return 0;

    const avgDistance = totalDistance / count;
    const maxAllowedDistance = 0.15;
    const similarity = Math.max(0, 1 - avgDistance / maxAllowedDistance);

    return similarity;
  }, [keypoints]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    
    setRemainingTime(5); // 타이머 초기화
    timerRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsReadyPose(true);
          onReady();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, [onReady]);

  const checkReadyPose = useCallback(() => {
    if (landmarks && canvasRef.current) {
      const requiredLandmarks = extractRequiredLandmarks(landmarks);
      const similarity = calculatePoseSimilarity(requiredLandmarks, targetPose.current);
      setSimilarityResult(similarity);
  
      if (similarity >= similarityThreshold) {
        if (!timerRef.current) {
          startTimer(); // 타이머가 실행 중이 아닐 때만 시작
        }
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRemainingTime(5);
        }
      }
    }
  }, [landmarks, calculatePoseSimilarity, similarityThreshold, extractRequiredLandmarks, startTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }, [canvasSize]);

  useEffect(() => {
    checkReadyPose();
  }, [landmarks, checkReadyPose]);

  const [headerText, setHeaderText] = useState("점선에 어깨와 머리를 맞춰주세요");
  const [headerColor, setHeaderColor] = useState('white');

  useEffect(() => {
    setHeaderText(timerRef.current ? "거리를 유지해주세요" : "점선에 어깨와 머리를 맞춰주세요");
  }, []); 
  
  useEffect(() => {
    const checkTimer = () => {
      setHeaderText(timerRef.current ? "거리를 유지해주세요" : "점선에 어깨와 머리를 맞춰주세요");
    };
    checkTimer();
    const intervalId = setInterval(checkTimer, 100);
  
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (similarityResult >= 0.7) setHeaderColor('green');
    else if (similarityResult >= 0.5) setHeaderColor('yellow');
    else setHeaderColor('red');
  }, [similarityResult]);

  return (
    <div className="relative w-full h-full">
      <div className="ready-header" style={{ '--header-color': headerColor }}>
        {headerText}
      </div>
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="similarity-info">
        Similarity: {similarityResult ? similarityResult.toFixed(2) : 'N/A'}
      </div>
      {(timerRef.current && remainingTime <= 4) && (
        <div className="countdown-text">
          {remainingTime === 1 ? 'GO!' : remainingTime - 1}
        </div>
      )}
    </div>
  );
}