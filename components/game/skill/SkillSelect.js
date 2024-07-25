import React, { useRef, useEffect, useState, useCallback } from 'react';
import { attackSkill, healSkill, shieldSkill } from './SkillConfig';
import useSocketStore from '@/store/socketStore';
import stringSimilarity from 'string-similarity';
import SkillProgressBar from '@/components/game/skill/SkillProgressBar';
import useGameStore from '@/store/gameStore';

// usePrevious 훅을 정의합니다.
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default function SkillSelect({ localVideoRef, landmarks, canvasSize, poseLandmarks, onUseSkill, finalTranscript }) {
  const canvasRef = useRef(null);
  const [activeSkill, setActiveSkill] = useState(null);
  const [skillText, setSkillText] = useState('');
  const skillTextRef = useRef('');
  const [skillTextColor, setSkillTextColor] = useState('');
  const [showSkillText, setShowSkillText] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showSkillInUseMessage, setShowSkillInUseMessage] = useState(false); // 스킬 사용 중 메시지 상태 추가
  const [showOpponentSkillMessage, setShowOpponentSkillMessage] = useState(false); // 상대방 스킬 사용 중 메시지 상태 추가
  const emitCastSkill = useSocketStore(state => state.emitCastSkill);
  const emitUseSkill = useSocketStore(state => state.emitUseSkill);
  const gameStatus = useGameStore(state => state.gameStatus);
  const playerSkills = useGameStore(state => state.playerSkills);
  const opponentSkills = useGameStore(state => state.opponentSkills);
  const similarityThreshold = 0.75;
  const recognitionActive = useRef(false);

  const [skillCooldowns, setSkillCooldowns] = useState({
    Shield: 0,
    Heal: 0,
    Attack: 0,
  });

  const skillColors = {
    Shield: 'bg-green-500',
    Heal: 'bg-blue-500',
    Attack: 'bg-red-500',
  };

  const [maxSimilarity, setMaxSimilarity] = useState(0);
  const maxSimilarityRef = useRef(0);
  const transcriptRef = useRef('');
  const intervalIds = useRef({});

  const recognition = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'ko-KR';

      recognition.current.onresult = (event) => {
        const finalTranscript = event.results[0][0].transcript;
        transcriptRef.current = finalTranscript;
        console.log(`Final Transcript: ${finalTranscript}`);
        console.log(`Skill Text: ${skillTextRef.current}`);
        if (skillTextRef.current) {
          const similarity = stringSimilarity.compareTwoStrings(
            finalTranscript.toLowerCase(),
            skillTextRef.current.toLowerCase()
          );
          if (similarity > maxSimilarityRef.current) {
            maxSimilarityRef.current = similarity;
            setMaxSimilarity(similarity);
          }
        }
      };

      recognition.current.onerror = (event) => {
        console.error('STT Error:', event);
      };
    }
  }, []);

  useEffect(() => {
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
      const textAudio = new Audio('./sounds/text.mp3');
      textAudio.play();
      let newSkillText = '';
      if (activeSkill === 'Shield') {
        newSkillText = shieldSkill.skillReading[Math.floor(Math.random() * shieldSkill.skillReading.length)];
        setSkillTextColor(shieldSkill.textColor);
      } else if (activeSkill === 'Heal') {
        newSkillText = healSkill.skillReading[Math.floor(Math.random() * healSkill.skillReading.length)];
        setSkillTextColor(healSkill.textColor);
      } else if (activeSkill === 'Attack') {
        newSkillText = attackSkill.skillReading[Math.floor(Math.random() * attackSkill.skillReading.length)];
        setSkillTextColor(attackSkill.textColor);
      }

      console.log(`New Skill Text: ${newSkillText}`);
      setSkillText(newSkillText);
      skillTextRef.current = newSkillText;
      setShowSkillText(true);
      maxSimilarityRef.current = 0;
      setMaxSimilarity(0);
      transcriptRef.current = '';

      if (!recognitionActive.current && typeof window !== 'undefined') {
        recognition.current.start();
        console.log("recog");
        recognitionActive.current = true;

        const recognitionTimeoutId = setTimeout(() => {
          recognitionActive.current = false;
          console.log("stop");
          recognition.current.stop();
        }, 4000);

        const timeoutId = setTimeout(() => {
          console.log(`Final transcript: ${transcriptRef.current}`);
          console.log(`Skill text: ${newSkillText}`);
          console.log(`Max similarity: ${maxSimilarityRef.current}`);
          if (gameStatus !== 'finished'){
            emitUseSkill(activeSkill, maxSimilarityRef.current);
          }
          setShowSkillText(false);
          handleSkillComplete();
          if (activeSkill === "Heal" && maxSimilarityRef.current > 0.2) {
            const healAudio = new Audio('./sounds/heal_sound.mp3');
            healAudio.play();
          }else if(activeSkill === "Shield"){
            const shieldAudio = new Audio('./sounds/heal_sound.mp3');
            shieldAudio.play();
          }else if(activeSkill === "Attack"){
            const attackAudio = new Audio('./sounds/heal_sound.mp3');
            attackAudio.play();
          }
          triggerSkillUse(activeSkill);
        }, 4000);

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(recognitionTimeoutId);
        };
      }
    }
  }, [activeSkill]);

  const triggerSkillUse = (skillName) => {
    if (skillCooldowns[skillName] === 0) {
      setSkillCooldowns(prev => ({
        ...prev,
        [skillName]: 25,
      }));

      const intervalId = setInterval(() => {
        setSkillCooldowns(prev => {
          if (prev[skillName] > 0) {
            return { ...prev, [skillName]: prev[skillName] - 1 };
          } else {
            clearInterval(intervalIds.current[skillName]);
            delete intervalIds.current[skillName];
            return { ...prev, [skillName]: 0 };
          }
        });
      }, 1000);

      intervalIds.current[skillName] = intervalId;
    }
  };

  useEffect(() => {
    Object.values(intervalIds.current).forEach(intervalId => clearInterval(intervalId));
    intervalIds.current = {};

    if (gameStatus === "playing") {
      Object.keys(skillCooldowns).forEach(skillName => {
        if (skillCooldowns[skillName] > 0) {
          const intervalId = setInterval(() => {
            setSkillCooldowns(prev => {
              if (prev[skillName] > 0) {
                return { ...prev, [skillName]: prev[skillName] - 1 };
              } else {
                clearInterval(intervalIds.current[skillName]);
                delete intervalIds.current[skillName];
                return { ...prev, [skillName]: 0 };
              }
            });
          }, 1000);

          intervalIds.current[skillName] = intervalId;
        }
      });
    }

    return () => {
      Object.values(intervalIds.current).forEach(intervalId => clearInterval(intervalId));
    };
  }, [gameStatus, skillCooldowns]);

  const handleSkillComplete = useCallback(() => {
    setActiveSkill(null);
    setSkillText('');
    skillTextRef.current = '';
    setSkillTextColor('');
    clearCanvas();

    if (maxSimilarityRef.current >= 0.70) {
      setResultMessage('Excelent🤮');
      setResultColor('green');
    } else if (maxSimilarityRef.current >= 0.5) {
      setResultMessage('Perfect!');
      setResultColor('blue');
    } else if (maxSimilarityRef.current > 0.20) {
      setResultMessage('Good!');
      setResultColor('orange');
    } else {
      setResultMessage('Bad!');
      setResultColor('red');
    }
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setResultColor('');
      setResultMessage('');
    }, 1000);
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
          if (poseSimilarity >= similarityThreshold && skillCooldowns[skill.name] === 0 && gameStatus === 'playing') {
            if (activeSkill !== skill.name) {
              if(playerSkills[0] !== null && playerSkills[1] !== null){
                setShowSkillInUseMessage(true); 
                setTimeout(() => setShowSkillInUseMessage(false), 2000); 
              } else {
                emitCastSkill(skill.name);
                setActiveSkill(skill.name);
              }
            }
          }
        });
      }
    }
  }, [poseLandmarks, gameStatus, skillCooldowns, activeSkill, playerSkills, emitCastSkill]);

  const previousOpponentSkill = usePrevious(opponentSkills[0]);

  useEffect(() => {
    
    if (previousOpponentSkill === null && opponentSkills[0] !== null && gameStatus === 'skillTime') {
      setShowOpponentSkillMessage(true);
      console.log(1);
      const timeoutId = setTimeout(() => {
        setShowOpponentSkillMessage(false);
      }, 4000);
  
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [previousOpponentSkill, opponentSkills[0], gameStatus]);
  
  useEffect(() => {
    if (showOpponentSkillMessage) {
      const timeoutId = setTimeout(() => {
        setShowOpponentSkillMessage(false);
      }, 4000);
  
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [showOpponentSkillMessage]);

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
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-8"> {/* Increased spacing */}
        {['Shield', 'Heal', 'Attack'].map(skill => (
          <SkillProgressBar
            key={skill}
            skillName={skill}
            cooldown={skillCooldowns[skill]}
            isActive={gameStatus === 'skillTime' && activeSkill === skill}
          />
        ))}
      </div>
      {showSkillText && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-6 rounded-lg shadow-lg bg-white" style={{ color: skillTextColor }}>
            <span className="text-4xl"> 
              {skillText}
            </span>
          </div>
        </div>
      )}
      {showResult && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-4 rounded-lg shadow-lg bg-white" style={{ color: resultColor }}>
            <span className="text-5xl">
              {resultMessage}
            </span>
          </div>
        </div>
      )}
      {showSkillInUseMessage && ( 
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-4 rounded-lg shadow-lg bg-white" style={{ color: 'red' }}>
            <span className="text-3xl">
              다른 스킬 사용 중입니다!
            </span>
          </div>
        </div>
      )}
      {showOpponentSkillMessage && ( // 상대방 스킬 사용 중 메시지
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="p-4 rounded-lg shadow-lg bg-white" style={{ color: 'red' }}>
            <span className="text-3xl">
              상대방이 스킬을 시전 중입니다!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
