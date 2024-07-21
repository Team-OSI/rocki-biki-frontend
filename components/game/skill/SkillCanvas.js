import React, { useRef, useEffect, useState, useCallback } from 'react';
import { attackSkill, healSkill, shieldSkill } from './SkillConfig';
import useSocketStore from '@/store/socketStore';
import useSTT from '@/hooks/useSTT';  

export default function SkillSelect({ localVideoRef, landmarks, canvasSize, poseLandmarks, onUseSkill, finalTranscript }) {
  const canvasRef = useRef(null);
  const [activeSkill, setActiveSkill] = useState(null);
  const [skillText, setSkillText] = useState('');
  const [skillTextColor, setSkillTextColor] = useState('');
  const emitCastSkill = useSocketStore(state => state.emitCastSkill);
  const similarityThreshold = 0.70;

  const onSTTResult = ({ finalTranscript }) => {
    console.log('Final STT Result:', finalTranscript);
  };

  const onSTTError = (event) => {
    console.error('STT Error:', event);
  };

  const { startRecognition, stopRecognition } = useSTT(onSTTResult, onSTTError);

  useEffect(() => {
    // 필요한 이미지 프리 로드
    const shield_img = new Image();
    shield_img.src = '/images/love.png';
    shield_img.onload = () => {
      console.log('Heart image loaded successfully');
    };

    const heal_img = new Image();
    heal_img.src = '/images/crown.png';
    heal_img.onload = () => {
      console.log('Crown image loaded successfully');
    };

    const attack_img = new Image();
    attack_img.src = '/images/tattoo.png';
    attack_img.onload = () => {
      console.log('Tattoo image loaded successfully');
    };
  }, []);

  useEffect(() => {
    if (activeSkill) {
      emitCastSkill(activeSkill);
      console.log(activeSkill);
      if (activeSkill === 'Shield') {
        setSkillText(shieldSkill.skillReading);
        setSkillTextColor(shieldSkill.textColor);
      } else if (activeSkill === 'Heal') {
        setSkillText(healSkill.skillReading);
        setSkillTextColor(healSkill.textColor);
      } else if (activeSkill === 'Attack') {
        setSkillText(attackSkill.skillReading);
        setSkillTextColor(attackSkill.textColor);
      }
      startRecognition(); // 포즈가 인식되면 STT 시작
      const timeoutId = setTimeout(() => {
        stopRecognition(); // 5초 후 STT 종료
        handleSkillComplete();
      }, 5000);
      return () => clearTimeout(timeoutId); // 컴포넌트 언마운트 시 타임아웃 정리
    }
  }, [activeSkill, emitCastSkill, startRecognition, stopRecognition]);

  const handleSkillComplete = useCallback(() => {
    setActiveSkill(null);
    setSkillText('');
    setSkillTextColor('');
    clearCanvas();
  }, []);

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
        const skills = [shieldSkill, healSkill, attackSkill];
        skills.forEach(skill => {
          const poseSimilarity = calculatePoseSimilarity(detectedPose, skill.targetPose);
          if (poseSimilarity >= similarityThreshold) {
            setActiveSkill(skill.name);
          }
        });
      }
    }
  }, [poseLandmarks]);

  const drawSkillText = (text, color) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.fillStyle = color;
      ctx.font = '24px Arial';
      ctx.fillText(text, 10, 50); // 원하는 위치에 텍스트를 그립니다
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    }
  };

  useEffect(() => {
    if (skillText) {
      drawSkillText(skillText, skillTextColor);
    } else {
      clearCanvas();
    }
  }, [skillText, skillTextColor]);

  return (
    <div className='skill-select-container relative' style={{ width: canvasSize.width, height: canvasSize.height }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {skillText && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-4 rounded-lg shadow-lg" style={{ backgroundImage: 'url(/images/parchment.png)', backgroundSize: 'cover', color: skillTextColor }}>
            <span className="text-3xl">
              {skillText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
