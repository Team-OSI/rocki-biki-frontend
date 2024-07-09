import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ProgressButton from './ProgressButton';

export default function SkillSelect({ localVideoRef, landmarks, canvasSize }) {
  const canvasRef = useRef(null);
  const [buttonProgress, setButtonProgress] = useState({});

  const lastUpdateTimeRef = useRef({});
  const HOVER_THRESHOLD = 1000; // 1초
  
  const [activeSkill, setActiveSkill] = useState(null);
  const [showShieldSkill, setShowShieldSkill] = useState(false);
  const [showHealSkill, setShowHealSkill] = useState(false);
  const [showAttackSkill, setShowAttackSkill] = useState(false);

  const [shieldImage, setShieldImage] = useState(null);
  const [shieldBackImage, setShieldBackImage] = useState(null);
  const [healImage, setHealImage] = useState(null);
  const [healBackImage, setHealBackImage] = useState(null);
  const [attackImage, setAttackImage] = useState(null);
  const [attackBackImage, setAttackBackImage] = useState(null);
  
  const buttons = [
    { id: 'Shield', x: 50, y: canvasSize.height - 60, width: 100, height: 50, backgroundColor: 'rgba(21, 20, 21, 0.65)', progressColor: 'rgba(245, 234, 39, 0.8)' },
    { id: 'Heal', x: canvasSize.width / 2 - 50, y: canvasSize.height - 60, width: 100, height: 50, backgroundColor: 'rgba(21, 20, 21, 0.65)', progressColor: 'rgba(246, 36, 145, 0.65)' },
    { id: 'Attack', x: canvasSize.width - 150, y: canvasSize.height - 60, width: 100, height: 50, backgroundColor: 'rgba(21, 20, 21, 0.65)', progressColor: 'rgba(0, 0, 255, 0.8)' },
  ];

  useEffect(() => {
    // 필요한 이미지 프리 로드
    const shield_img = new Image();
    shield_img.src = '/img/love.png';
    shield_img.onload = () => {
      console.log('Heart image loaded successfully');
      setShieldImage(shield_img);
    };  
    
    const shield_back_img = new Image();
    shield_back_img.src = '/img/shield_background.jpg';
    shield_back_img.onload = () => {
      console.log('Background image loaded successfully (Shield)');
      setShieldBackImage(shield_back_img);
    };  

    const heal_img = new Image();
    heal_img.src = '/img/crown.png';
    heal_img.onload = () => {
      console.log('Crown image loaded successfully');
      setHealImage(heal_img);
    };

    const heal_back_img = new Image();
    heal_back_img.src = '/img/heal_background.jpg';
    heal_back_img.onload = () => {
      console.log('Background image loaded successfully (Heal)');
      setHealBackImage(heal_back_img);
    };

    const attack_img = new Image();
    attack_img.src = '/img/tattoo.png';
    attack_img.onload = () => {
      console.log('Tattoo image loaded successfully');
      setAttackImage(attack_img);
    };

    const attack_back_img = new Image();
    attack_back_img.src = '/img/attack_background.jpg';
    attack_back_img.onload = () => {
      console.log('Background image loaded successfully (Attack)');
      setAttackBackImage(attack_back_img);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      // 랜드마크를 사용하여 손의 위치 확인
      if (landmarks.leftHand && landmarks.rightHand) {
        const leftHand = landmarks.leftHand?.[0];
        const rightHand = landmarks.rightHand?.[0];
        
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
    const canvasX = x * canvasSize.width;
    const canvasY = y * canvasSize.height;
    return canvasX > button.x && canvasX < button.x + button.width &&
           canvasY > button.y && canvasY < button.y + button.height;
  };

  const updateButtonProgress = (buttonId) => {
      setButtonProgress(prev => {
          const newProgress = Math.min((prev[buttonId] || 0) + 0.05, 1);
          if (newProgress >= 1) {
              setActiveSkill(buttonId);
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
          progress={buttonProgress[button.id] || 0}
        />
      ))}
      {/* {showShieldSkill && (
        <ShieldSkill 
          webcamRef={localVideoRef} 
          image={shieldImage} 
          backgroundImage={shieldBackImage} 
          onSkillComplete={handleSkillComplete}
        />
      )}
      {showHealSkill && (
        <HealSkill 
          webcamRef={localVideoRef} 
          image={healImage} 
          backgroundImage={healBackImage} 
          onSkillComplete={handleSkillComplete}
        />
      )}
      {showAttackSkill && (
        <AttackSkill 
          webcamRef={localVideoRef} 
          image={attackImage} 
          backgroundImage={attackBackImage} 
          onSkillComplete={handleSkillComplete}
        />
      )} */}
    </div>
  );
};
