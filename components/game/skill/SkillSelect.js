import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ProgressButton from './ProgressButton';
import { attackSkill, healSkill, shieldSkill } from './SkillConfig';
import SkillCanvas from './SkillCanvas';

export default function SkillSelect({ localVideoRef, landmarks, canvasSize, poseLandmarks, onUseSkill }) {
  const canvasRef = useRef(null);
  const [buttonProgress, setButtonProgress] = useState({});

  const [activeSkill, setActiveSkill] = useState(null);
  const [showShieldSkill, setShowShieldSkill] = useState(false);
  const [showHealSkill, setShowHealSkill] = useState(false);
  const [showAttackSkill, setShowAttackSkill] = useState(false);

  const [shieldImage, setShieldImage] = useState(null);
  const [healImage, setHealImage] = useState(null);
  const [attackImage, setAttackImage] = useState(null);

  const buttonWidth = 120;
  const buttonHeight = 80;

  const buttons = useMemo(() => [
    { 
      id: 'Shield', 
      getX: (canvasWidth) => canvasWidth * 0.8 - buttonWidth / 2,
      getY: (canvasHeight) => canvasHeight * 0.2 - buttonHeight / 2,
      width: buttonWidth, 
      height: buttonHeight, 
      backgroundColor: 'rgba(21, 20, 21, 0.65)', 
      progressColor: 'rgba(245, 234, 39, 0.8)' 
    },
    { 
      id: 'Heal', 
      getX: (canvasWidth) => canvasWidth * 0.8 - buttonWidth / 2,
      getY: (canvasHeight) => canvasHeight * 0.5 - buttonHeight / 2,
      width: buttonWidth, 
      height: buttonHeight, 
      backgroundColor: 'rgba(21, 20, 21, 0.65)', 
      progressColor: 'rgba(246, 36, 145, 0.65)' 
    },
    { 
      id: 'Attack', 
      getX: (canvasWidth) => canvasWidth * 0.8 - buttonWidth / 2,
      getY: (canvasHeight) => canvasHeight * 0.8 - buttonHeight / 2,
      width: buttonWidth, 
      height: buttonHeight, 
      backgroundColor: 'rgba(21, 20, 21, 0.65)', 
      progressColor: 'rgba(0, 0, 255, 0.8)' 
    },
  ], []);

  const skillConfigs = {
    shield: {
      show: showShieldSkill,
      image: shieldImage,
      skillConfig: shieldSkill
    },
    heal: {
      show: showHealSkill,
      image: healImage,
      skillConfig: healSkill
    },
    attack: {
      show: showAttackSkill,
      image: attackImage,
      skillConfig: attackSkill
    }
  };

  const mapHandCoordinates = (hand) => {
    return [
      1 - hand[0], // x 좌표 반전
      hand[1]
    ];
  };

  useEffect(() => {
    // 필요한 이미지 프리 로드
    const shield_img = new Image();
    shield_img.src = '/images/love.png';
    shield_img.onload = () => {
      console.log('Heart image loaded successfully');
      setShieldImage(shield_img);
    };

    const heal_img = new Image();
    heal_img.src = '/images/crown.png';
    heal_img.onload = () => {
      console.log('Crown image loaded successfully');
      setHealImage(heal_img);
    };

    const attack_img = new Image();
    attack_img.src = '/images/tattoo.png';
    attack_img.onload = () => {
      console.log('Tattoo image loaded successfully');
      setAttackImage(attack_img);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      if (landmarks.leftHand && landmarks.rightHand) {
        const leftHand = mapHandCoordinates(landmarks.leftHand[0]);
        const rightHand = mapHandCoordinates(landmarks.rightHand[0]);
  
        // 손 위치 시각화 (디버깅용)
        [leftHand, rightHand].forEach(hand => {
          ctx.beginPath();
          ctx.arc(hand[0] * canvasSize.width, hand[1] * canvasSize.height, 10, 0, 2 * Math.PI);
          ctx.fillStyle = 'red';
          ctx.fill();
        });
  
        buttons.forEach(button => {
          if (isHandOverButton(leftHand, button, canvasSize) || isHandOverButton(rightHand, button, canvasSize)) {
            updateButtonProgress(button.id);
          } else {
            resetButtonProgress(button.id);
          }

        });
      }
    }
  }, [landmarks, canvasSize, buttons]);

  const isHandOverButton = (hand, button, canvasSize) => {
    if (!hand) return false;
    const [x, y] = hand;
    const buttonX = button.getX(canvasSize.width) / canvasSize.width;
    const buttonY = button.getY(canvasSize.height) / canvasSize.height;
    const buttonWidth = button.width / canvasSize.width;
    const buttonHeight = button.height / canvasSize.height;

    const isOver = x > buttonX && x < buttonX + buttonWidth &&
                  y > buttonY && y < buttonY + buttonHeight;
    
    return isOver;
  };

  const updateButtonProgress = (buttonId) => {
    setButtonProgress(prev => {
      const newProgress = Math.min((prev[buttonId] || 0) + 0.05, 1);
      if (newProgress >= 1) {
        setActiveSkill(buttonId);
        console.log("Calling onUseSkill with:", buttonId.toLowerCase());
        onUseSkill(buttonId.toLowerCase());
        return { ...prev, [buttonId]: 0 };
      }
      return { ...prev, [buttonId]: newProgress };
    });
  };

  const resetButtonProgress = (buttonId) => {
      setButtonProgress(prev => ({ ...prev, [buttonId]: 0 }));
  };

  // 스킬에 따른 캔버스 호출
  useEffect(() => {
    if (activeSkill) {
      if (activeSkill === 'Shield') {
        setShowShieldSkill(true);
        setShowHealSkill(false);
        setShowAttackSkill(false);
      } 
      else if (activeSkill === 'Heal') {
        setShowShieldSkill(false);
        setShowHealSkill(true);
        setShowAttackSkill(false);
      } 
      else if (activeSkill === 'Attack') {
        setShowShieldSkill(false);
        setShowHealSkill(false);
        setShowAttackSkill(true);
      }
    }
  }, [activeSkill]);

  const handleSkillComplete = useCallback(() => {
    setShowShieldSkill(false);
    setShowHealSkill(false);
    setShowAttackSkill(false);
    setActiveSkill(null);
  }, []);

  return (
    <div className='skill-select-container' style={{ width: canvasSize.width, height: canvasSize.height, position: 'absolute', top: 0, left: 0 }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      {buttons.map(button => (
        <ProgressButton
          key={button.id}
          {...button}
          x={button.getX(canvasSize.width)}
          y={button.getY(canvasSize.height)}
          progress={buttonProgress[button.id] || 0}
        />
      ))}
      {Object.entries(skillConfigs).map(([skillType, config]) => (
        config.show && (
          <SkillCanvas
            key={skillType}
            videoElement={localVideoRef.current}
            image={config.image}
            onSkillComplete={handleSkillComplete}
            poseLandmarks={poseLandmarks}
            skillConfig={config.skillConfig}
          />
        )
      ))}
    </div>
  );
};
