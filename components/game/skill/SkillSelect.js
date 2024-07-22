import React, { useRef, useEffect, useState, useCallback } from 'react';
import { attackSkill, healSkill, shieldSkill } from './SkillConfig';
import useSocketStore from '@/store/socketStore';
import useSTT from '@/hooks/useSTT';
import stringSimilarity from 'string-similarity';

export default function SkillSelect({ localVideoRef, landmarks, canvasSize, poseLandmarks, onUseSkill, finalTranscript }) {
  const canvasRef = useRef(null);
  const [activeSkill, setActiveSkill] = useState(null);
  const [skillText, setSkillText] = useState('');
  const [skillTextColor, setSkillTextColor] = useState('');
  const [showSkillText, setShowSkillText] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const emitCastSkill = useSocketStore(state => state.emitCastSkill);
  const emitUseSkill = useSocketStore(state => state.emitUseSkill);
  const similarityThreshold = 0.80;
  const recognitionActive = useRef(false);
  
  const [maxSimilarity, setMaxSimilarity] = useState(0);
  const maxSimilarityRef = useRef(0);
  const transcriptRef = useRef('');

  const onSTTResult = ({ finalTranscript }) => {
    console.log('STT Result:', finalTranscript);
    transcriptRef.current = finalTranscript;
    if (skillText) {
      const similarity = stringSimilarity.compareTwoStrings(
        finalTranscript.toLowerCase(),
        skillText.toLowerCase()
      );
      if (similarity > maxSimilarityRef.current) {
        maxSimilarityRef.current = similarity;
        setMaxSimilarity(similarity);
      }
    }
  };

  const onSTTError = (event) => {
    console.error('STT Error:', event);
  };

  const { startRecognition, stopRecognition } = useSTT(onSTTResult, onSTTError);

  useEffect(() => {
    // Load images
    const shield_img = new Image();
    shield_img.src = '/images/skill/love.png';
    shield_img.onload = () => {
      console.log('Heart image loaded successfully');
    };

    const heal_img = new Image();
    heal_img.src = '/images/skill/crown.png';
    heal_img.onload = () => {
      console.log('Crown image loaded successfully');
    };

    const attack_img = new Image();
    attack_img.src = '/images/skill/tattoo.png';
    attack_img.onload = () => {
      console.log('Tattoo image loaded successfully');
    };
  }, []);

  useEffect(() => {
    if (activeSkill) {
      if (activeSkill === 'Shield') {
        setSkillText(shieldSkill.skillReading[Math.floor(Math.random() * shieldSkill.skillReading.length)]);
        setSkillTextColor(shieldSkill.textColor);
      } else if (activeSkill === 'Heal') {
        setSkillText(healSkill.skillReading[Math.floor(Math.random() * healSkill.skillReading.length)]);
        setSkillTextColor(healSkill.textColor);
      } else if (activeSkill === 'Attack') {
        setSkillText(attackSkill.skillReading[Math.floor(Math.random() * attackSkill.skillReading.length)]);
        setSkillTextColor(attackSkill.textColor);
      }

      setShowSkillText(true);
      setShowClock(true);
      maxSimilarityRef.current = 0;
      setMaxSimilarity(0);
      transcriptRef.current = '';
      const timeoutId = setTimeout(() => {
        console.log(`Final transcript: ${transcriptRef.current}`);
        console.log(`Skill text: ${skillText}`);
        console.log(`Max similarity: ${maxSimilarityRef.current}`);
        emitUseSkill(activeSkill, maxSimilarityRef.current);
        setShowSkillText(false);
        setShowClock(false);
        handleSkillComplete();
      }, 5000);

      if (!recognitionActive.current) {
        startRecognition();
        recognitionActive.current = true;
        
        const recognitionTimeoutId = setTimeout(() => {
          recognitionActive.current = false;
          stopRecognition();
        }, 5000);

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(recognitionTimeoutId);
        };
      }
    }
  }, [activeSkill]);

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
            if (activeSkill !== skill.name) {
              console.log("here");
              emitCastSkill(skill.name);
              setActiveSkill(skill.name);
            }
          }
        });
      }
    }
  }, [poseLandmarks]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    }
  };

  return (
    <div className='skill-select-container relative' style={{ width: canvasSize.width, height: canvasSize.height }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {showSkillText && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-4 rounded-lg shadow-lg" style={{ backgroundImage: 'url(/images/skill.png)', backgroundSize: 'cover', backgroundSize: '200% 200%', color: skillTextColor }}>
            <span className="text-3xl">
              {skillText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
