'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ReadyCanvas({ onReady, landmarks, canvasSize }) {
  const canvasRef = useRef(null);
  const [similarityResult, setSimilarityResult] = useState(null);
  const [isReadyPose, setIsReadyPose] = useState(false);
  const similarityThreshold = 0.80;
  const keypoints = ['nose', 'leftEye', 'rightEye', 'leftHand', 'rightHand'];

  const targetPose = useRef({
    nose: { x: 0.5, y: 0.5 },
    leftEye: { x: 0.4, y: 0.4 },
    rightEye: { x: 0.6, y: 0.4 },
    leftHand: { x: 0.3, y: 0.6 },
    rightHand: { x: 0.7, y: 0.6 }
  });

  const normalizeCoordinates = useCallback((landmarks) => {
    const normalizedLandmarks = {};
    for (const [key, point] of Object.entries(landmarks)) {
      if (point && point !== null) {
        normalizedLandmarks[key] = {
          x: point.x / canvasSize.width,
          y: point.y / canvasSize.height
        };
      }
    }
    return normalizedLandmarks;
  }, [canvasSize]);

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
    const maxAllowedDistance = 0.2; // 20% of normalized space
    const similarity = Math.max(0, 1 - avgDistance / maxAllowedDistance);

    return similarity;
  }, [keypoints]);

  const checkReadyPose = useCallback(() => {
      if (landmarks && canvasRef.current) {
          const normalizedLandmarks = normalizeCoordinates(landmarks);
          const similarity = calculatePoseSimilarity(normalizedLandmarks, targetPose.current);
          setSimilarityResult(similarity);
          setIsReadyPose(similarity >= similarityThreshold);
      }
  }, [landmarks, calculatePoseSimilarity, normalizeCoordinates, similarityThreshold]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    console.log('Drawing on canvas. Size:', canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ready Canvas - Get into position', canvas.width / 2, 50);

    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    for (const [key, point] of Object.entries(targetPose.current)) {
      console.log(`Drawing ${key} at`, point.x * canvas.width, point.y * canvas.height);
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 10, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'yellow';
      ctx.fill();
    }

    if (landmarks) {
      ctx.strokeStyle = 'blue';
      for (const [key, point] of Object.entries(landmarks)) {
        if (point && point !== null) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }
  }, [landmarks]);

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
    console.log('Raw landmarks:', landmarks);

    if (landmarks) {
      const landmarkCoordinates = {};
      
      for (const keypoint of keypoints) {
        if (landmarks[keypoint] && landmarks[keypoint] !== null) {
          landmarkCoordinates[keypoint] = {
            x: Math.round(landmarks[keypoint].x * 100) / 100,
            y: Math.round(landmarks[keypoint].y * 100) / 100
          };
        } else {
          console.log(`Missing or null keypoint: ${keypoint}`);
        }
      }

      console.log('Processed Landmark Coordinates:', landmarkCoordinates);
      console.log('Number of detected landmarks:', Object.keys(landmarkCoordinates).length);
    } else {
      console.log('No landmarks detected');
    }
  }, [landmarks]);

  useEffect(() => {
    console.log('Target pose:', targetPose.current);
    console.log('Canvas size:', canvasSize);
  }, [canvasSize]);

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