'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ReadyCanvas({ onReady, landmarks, canvasSize }) {
  const canvasRef = useRef(null);
  const [similarityResult, setSimilarityResult] = useState(null);
  const [isReadyPose, setIsReadyPose] = useState(false);
  const keypoints = ['nose', 'leftShoulder', 'rightShoulder'];
  const similarityThreshold = 0.80;

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

  const checkReadyPose = useCallback(() => {
    if (landmarks && canvasRef.current) {
      const requiredLandmarks = extractRequiredLandmarks(landmarks);
      const similarity = calculatePoseSimilarity(requiredLandmarks, targetPose.current);
      setSimilarityResult(similarity);
      setIsReadyPose(similarity >= similarityThreshold);
      if (similarity >= similarityThreshold) {
        onReady();
      }
    }
  }, [landmarks, calculatePoseSimilarity, similarityThreshold, onReady, extractRequiredLandmarks]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawingAreaWidth = canvas.width * 0.4;  // 40vw
    const drawingAreaHeight = drawingAreaWidth * 3/4;  // 4:3 ratio
    const startX = canvas.width / 2 + 5;  // 화면 중앙에서 약간 오른쪽
    const startY = (canvas.height - drawingAreaHeight) / 2;

    // 그리기 영역 표시 (디버깅용)
    ctx.strokeStyle = 'white';
    ctx.strokeRect(startX, startY, drawingAreaWidth, drawingAreaHeight);

    // 타겟 포즈 그리기
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    for (const [key, point] of Object.entries(targetPose.current)) {
      const x = startX + point.x * drawingAreaWidth;
      const y = startY + point.y * drawingAreaHeight;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'yellow';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(startX + targetPose.current.leftShoulder.x * drawingAreaWidth, startY + targetPose.current.leftShoulder.y * drawingAreaHeight);
    ctx.lineTo(startX + targetPose.current.nose.x * drawingAreaWidth, startY + targetPose.current.nose.y * drawingAreaHeight);
    ctx.lineTo(startX + targetPose.current.rightShoulder.x * drawingAreaWidth, startY + targetPose.current.rightShoulder.y * drawingAreaHeight);
    ctx.stroke();
  }, [landmarks, canvasSize, extractRequiredLandmarks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    draw();
  }, [canvasSize, draw]);

  useEffect(() => {
    checkReadyPose();
    draw();
  }, [landmarks, checkReadyPose, draw]);
  
  // 디버깅 용
  useEffect(() => {
    const requiredLandmarks = extractRequiredLandmarks(landmarks);
    if (requiredLandmarks) {
      const landmarkCoordinates = {};
      
      for (const keypoint of keypoints) {
        if (requiredLandmarks[keypoint] && requiredLandmarks[keypoint] !== null) {
          landmarkCoordinates[keypoint] = {
            x: Math.round(requiredLandmarks[keypoint].x * 100) / 100,
            y: Math.round(requiredLandmarks[keypoint].y * 100) / 100
          };
        } else {
          console.log(`Missing or null keypoint: ${keypoint}`);
        }
      }
    } else {
      console.log('No landmarks detected');
    }
  }, [landmarks, keypoints, extractRequiredLandmarks]);

  const readyMessageStyle = {
    position: 'absolute',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    zIndex: 100,
  };

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {isReadyPose && (
        <div style={readyMessageStyle}>
          준비 완료!
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'white' }}>
        Similarity: {similarityResult ? similarityResult.toFixed(2) : 'N/A'}
      </div>
    </div>
  );
}