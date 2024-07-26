import styled, { keyframes, css } from 'styled-components';
import { useEffect, useState, useRef, useCallback } from 'react';
import useGameStore from '../../store/gameStore';
import useSocketStore from '@/store/socketStore';
import useGameLogic from '@/hooks/useGameLogic';
import Confetti from 'react-confetti';
import { useRouter } from 'next/navigation';
import { saveGameResults } from "@/api/user/api";

const scaleAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.9); }
`;

const TimerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 25vmin;
  height: 12vmin;
  animation: ${scaleAnimation} 1s ease-in-out infinite;
`;

const DigitImage = styled.img`
  height: 100%;
  width: auto;
  ${props => props.$isRed && css`
    filter: brightness(0) saturate(100%) invert(22%) sepia(95%) saturate(5333%) hue-rotate(356deg) brightness(97%) contrast(122%);
  `}
  ${props => props.$isOrange && css`
    filter: brightness(0) saturate(100%) invert(65%) sepia(91%) saturate(1766%) hue-rotate(360deg) brightness(103%) contrast(104%);
  `}
`;

const ResultModalContainer = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const ResultModal = styled.div`
  background-size: cover;
  padding: 4rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 30%;
  position: relative;
  overflow: hidden;
`;

const ResultText = styled.h2`
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 2rem;
  animation: ${props => props.$isWinner ? pulseResultAnimation : shakeAnimation} 2s infinite;
  background: ${props => props.$isWinner
    ? 'linear-gradient(90deg, #FFD700, #FFA500)'
    : 'linear-gradient(90deg, #A9A9A9, #696969)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: ${props => props.$isWinner
    ? '2px 2px 5px rgba(255,215,0,0.5)'
    : '2px 2px 5px rgba(105,105,105,0.5)'};
`;

const NicknameText = styled.h3`
  font-size: 3.5rem;
  margin-bottom: 3rem;
  background: linear-gradient(to right, #32CD32, #ADFF2F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 5px rgba(0,0,0,0.5);
  font-weight: bold;
`;

const ExitButton = styled.button`
  background: ${props => props.$isWinner
      ? 'linear-gradient(90deg, #4CAF50, #45a049)'
      : 'linear-gradient(90deg, #f44336, #d32f2f)'};
  color: white;
  font-weight: bold;
  padding: 1rem 2rem;
  border-radius: 9999px;
  transition: all 0.3s ease-in-out;
  transform: scale(1);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  z-index: 2; 
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }
`;

const pulseResultAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const pulseAnimation = keyframes`
  0% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`;

const HealthBarContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  border-radius: 400px;
`;

const BaseHealthBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 400px;
  transform-origin: left;
`;

const AnimatedHealthBar = styled(BaseHealthBar)`
  background-color: ${props => props.$isplayer
    ? 'rgba(252, 165, 165, 0.8)' // 연한 빨강 (player)
    : 'rgba(147, 197, 253, 0.8)' // 연한 파랑 (opponent)
};
`;

const CurrentHealthBar = styled(BaseHealthBar)`
  background-color: ${props => props.$isplayer
    ? 'rgba(220, 38, 38, 0.8)'
    : 'rgba(37, 99, 235, 0.8)'
};
  transition: transform 0.5s ease-out;
  z-index: 1;
`;

const DamageOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
  background-image: url('/images/damage_overlay.webp');
  background-size: cover;
  background-position: center;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: all 0.5s ease-in-out;
  animation: ${pulseAnimation} 0.5s ease-in-out;
`;

const waveAnimation = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const WaveContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 33%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
`;

const Wave = styled.div`
  position: absolute;
  bottom: 0;
  width: 200%;
  height: 100px;
  background: url(${props => props.$isWinner ? '/images/win_wave.svg' : '/images/wave.svg'}) repeat-x;
  animation: ${waveAnimation} 5s linear infinite;
  opacity: 0.5;
`;

const KOImage = styled.img`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  width: 40%;
`;

const TimeoutImage = styled.img`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  width: 40%;
`;

const preloadImages = () => {
  return new Promise((resolve, reject) => {
    const imageUrls = Array.from({ length: 10 }, (_, i) => `/images/count/${i}.png`);
    imageUrls.push('/images/timeout.png', '/images/ko.png');
    let loadedCount = 0;

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imageUrls.length) {
          resolve();
        }
      };
      img.onerror = reject;
    });
  });
};

const Timer = ({ count, showTimeout }) => {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const isRed = count <= 10;
  const isOrange = count > 10 && count <= 30;

  useEffect(() => {
    setTens(Math.floor(count / 10));
    setOnes(count % 10);
  }, [count]);

  return (
    <TimerContainer>
      {showTimeout ? (
        <DigitImage src="/images/timeout.png" />
      ) : (
        <>
          <DigitImage src={`/images/count/${tens}.png`} $isRed={isRed} $isOrange={isOrange} />
          <DigitImage src={`/images/count/${ones}.png`} $isRed={isRed} $isOrange={isOrange} />
        </>
      )}
    </TimerContainer>
  );
};

export default function StateBar() {
  const { gameStatus, opponentHealth, playerHealth, winner, roomInfo } = useGameStore();
  const router = useRouter();
  const socket = useSocketStore(state => state.socket);
  const [count, setCount] = useState(20);
  const [pausedCount, setPausedCount] = useState(90); // 멈춘 시간 추적 상태
  const [isLoading, setIsLoading] = useState(true);
  const damageAudio = useRef(null);
  const { handleRoomInfo } = useGameLogic();
  const [nickname, setNickname] = useState('');
  const [opponentEmail, setOpponentEmail] = useState('');
  const setIsLoadingImages = useGameStore(state => state.setIsLoadingImages);
  const emitGameEnd = useSocketStore(state => state.emitGameEnd);

  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);
  const koAudioRef = useRef(null);  // KO 오디오 참조 추가
  const timeoutAudioRef = useRef(null);  // 타임아웃 오디오 참조 추가

  const [showKO, setShowKO] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);  // 타임아웃 상태 추가

  const playDamageSound = useCallback(() => {
    if (damageAudio.current) {
      damageAudio.current.currentTime = 0;
      damageAudio.current.play().catch(error => console.log('오디오 재생 실패:', error));
    }
  }, []);

  useEffect(() => {
    winAudioRef.current = new Audio('./sounds/win_sound.mp3');
    winAudioRef.current.loop = true;
    loseAudioRef.current = new Audio('./sounds/lose_sound.mp3');
    loseAudioRef.current.loop = true;
    koAudioRef.current = new Audio('./sounds/ko.mp3');  
    koAudioRef.current.loop = false;
    timeoutAudioRef.current = new Audio('./sounds/timeout.mp3');  
    timeoutAudioRef.current.loop = false;
  }, []);

  useEffect(() => {
    if (roomInfo && socket.id && roomInfo.playerInfo && roomInfo.playerInfo.length) {
      const player = roomInfo.playerInfo.find(p => p.socketId === socket.id);
      if (player) {
        setNickname(player.nickname);
      }
    }
  }, [roomInfo]);

  useEffect(() => {
    if (roomInfo && socket.id && roomInfo.playerInfo && roomInfo.playerInfo.length) {
      const player = roomInfo.playerInfo.find(p => p.socketId !== socket.id);
      if (player) {
        setOpponentEmail(player.email);
      }
    }
  }, [roomInfo]);

  const [currentPlayerHealth, setCurrentPlayerHealth] = useState(playerHealth);
  const [previousPlayerHealth, setPreviousPlayerHealth] = useState(playerHealth);
  const [currentOpponentHealth, setCurrentOpponentHealth] = useState(opponentHealth);
  const [previousOpponentHealth, setPreviousOpponentHealth] = useState(opponentHealth);

  const [isPlayerDecreasing, setIsPlayerDecreasing] = useState(false);
  const [isOpponentDecreasing, setIsOpponentDecreasing] = useState(false);
  const [showDamageOverlay, setShowDamageOverlay] = useState(false);

  useEffect(() => {
    if (playerHealth < currentPlayerHealth) {
      setPreviousPlayerHealth(currentPlayerHealth);
      setCurrentPlayerHealth(playerHealth);
      setIsPlayerDecreasing(true);
      setShowDamageOverlay(true);
      playDamageSound();
      setTimeout(() => setShowDamageOverlay(false), 500);
    } else {
      setCurrentPlayerHealth(playerHealth);
    }
  }, [playerHealth]);

  useEffect(() => {
    if (opponentHealth < currentOpponentHealth) {
      setPreviousOpponentHealth(currentOpponentHealth);
      setCurrentOpponentHealth(opponentHealth);
      setIsOpponentDecreasing(true);
    } else {
      setCurrentOpponentHealth(opponentHealth);
    }
  }, [opponentHealth]);

  useEffect(() => {
    if (isPlayerDecreasing) {
      const timer = setTimeout(() => setIsPlayerDecreasing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerDecreasing]);

  useEffect(() => {
    if (isOpponentDecreasing) {
      const timer = setTimeout(() => setIsOpponentDecreasing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpponentDecreasing]);

  useEffect(() => {
    if (isLoading) {
      preloadImages()
        .then(() => {
          setIsLoading(false);
          setIsLoadingImages(false); // 이미지 로딩이 완료되면 전역 상태 업데이트
        })
        .catch((error) => {
          console.error("Error preloading images:", error);
          setIsLoading(false);
          setIsLoadingImages(false);
        });
    }
  }, [isLoading, setIsLoadingImages]);

  useEffect(() => {
    let timer;
    if (gameStatus === 'playing' && count > 0 && !isLoading) {
      timer = setInterval(() => {
        setCount((prevCount) => prevCount - 1);
      }, 1000);
    } else if (count === 0 || gameStatus === 'finished') {
      clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStatus, count, isLoading]);

  useEffect(() => {
    if (gameStatus === 'playing' && count === 90) {
      setCount(pausedCount);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === 'skilltime') {
      setPausedCount(count);
    }

    if (gameStatus === 'playing' && count === 0) {
      emitGameEnd();
    }
  }, [gameStatus, count]);

  useEffect(() => {
    let endTimeout;
    if (gameStatus === 'finished') {
        if (opponentHealth <= 0 || playerHealth <= 0) {
            setShowKO(true);
            koAudioRef.current.play().catch(error => console.log('KO 오디오 재생 실패:', error));
            endTimeout = setTimeout(() => {
                setShowKO(false);
                koAudioRef.current.pause();
                koAudioRef.current.currentTime = 0;
                if (winner === socket.id) {
                    winAudioRef.current.play().catch(error => console.log('승리 오디오 재생 실패:', error));
                } else {
                    loseAudioRef.current.play().catch(error => console.log('패배 오디오 재생 실패:', error));
                }
            }, 2000);
        } else if (opponentHealth > 0 && playerHealth > 0) {
            setShowTimeout(true);
            timeoutAudioRef.current.play().catch(error => console.log('타임아웃 오디오 재생 실패:', error));
            endTimeout = setTimeout(() => {
                setShowTimeout(false);
                timeoutAudioRef.current.pause();
                timeoutAudioRef.current.currentTime = 0;
                if (winner === socket.id) {
                  winAudioRef.current.play().catch(error => console.log('승리 오디오 재생 실패:', error));
              } else {
                  loseAudioRef.current.play().catch(error => console.log('패배 오디오 재생 실패:', error));
              }
            }, 2000);
        }
    }


    return () => {
        clearTimeout(endTimeout);
        if (winAudioRef.current) {
            winAudioRef.current.pause();
            winAudioRef.current.currentTime = 0;
        }
        if (loseAudioRef.current) {
            loseAudioRef.current.pause();
            loseAudioRef.current.currentTime = 0;
        }
        if (koAudioRef.current) {
            koAudioRef.current.pause();
            koAudioRef.current.currentTime = 0;
        }
        if (timeoutAudioRef.current) {
            timeoutAudioRef.current.pause();
            timeoutAudioRef.current.currentTime = 0;
        }
    };
    }, [gameStatus, winner, socket.id, opponentHealth, playerHealth]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      if (winner === socket.id) {
        saveGameResults(roomInfo.opponentEmail, true);
      } else {
        saveGameResults(roomInfo.opponentEmail, false);
      }
    }
  }, [gameStatus, winner, socket.id]);

  const handleRestart = () => {
    setCount(90);
    setPausedCount(90);
  };

  const handleLobby = () => {
    router.push('/lobby');
  };

  const renderRainEffect = () => {
    const rainDrops = Array.from({ length: 50 }, (_, i) => (
      <div
        key={i}
        className="absolute w-1 h-8 bg-blue-700 opacity-50 animate-rain"
        style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s` }}
      />
    ));
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {rainDrops}
      </div>
    );
  };

  return (
    <>
      {showKO && (
        <KOImage src="/images/ko.png" />
      )}
      {showTimeout && (
        <TimeoutImage src="/images/timeout.png" />
      )}
      {!showKO && !showTimeout && gameStatus === 'finished' && winner === socket.id && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={500}
          recycle={true}
          style={{ zIndex: 60 }}
        />
      )}
      {!showKO && !showTimeout && gameStatus === 'finished' && winner !== socket.id && renderRainEffect()}
      <div className='absolute z-40 w-full h-full'>
        <div className='absolute flex flex-row justify-between w-full mt-2 h-full px-4'>
          <div className="w-2/5 bg-gray-200 rounded-full h-6 mb-4 dark:bg-gray-700">
            <HealthBarContainer>
              <CurrentHealthBar
                style={{ transform: `scaleX(${currentOpponentHealth / 100})` }}
                $isplayer={false}
              />
              {isOpponentDecreasing && (
                <AnimatedHealthBar
                  style={{
                    transform: `scaleX(${previousOpponentHealth / 100})`,
                  }}
                  $isplayer={false}
                />
              )}
            </HealthBarContainer>
          </div>
          <div className='font-custom text-lg'>
            <Timer count={count} showTimeout={showTimeout} />
          </div>
          <div className="w-2/5 bg-gray-200 rounded-full h-6 mb-4 dark:bg-gray-700">
            <HealthBarContainer>
              <CurrentHealthBar
                style={{ transform: `scaleX(${currentPlayerHealth / 100})` }}
                $isplayer={true}
              />
              {isPlayerDecreasing && (
                <AnimatedHealthBar
                  style={{
                    transform: `scaleX(${previousPlayerHealth / 100})`,
                  }}
                  $isplayer={true}
                />
              )}
            </HealthBarContainer>
          </div>
        </div>
        {!showKO && !showTimeout && gameStatus === 'finished' && (
            <ResultModalContainer>
              <ResultModal $isWinner={winner === socket.id}>
                <ResultText $isWinner={winner === socket.id}>
                  {winner === socket.id ? '승리!' : '패배!'}
                </ResultText>
                <NicknameText>{nickname}</NicknameText>
                <WaveContainer>
                  <Wave $isWinner={winner === socket.id} />
                </WaveContainer>
                <ExitButton onClick={handleLobby} $isWinner={winner === socket.id}>
                  {winner === socket.id ? '나가기' : '나가기'}
                </ExitButton>
              </ResultModal>
            </ResultModalContainer>
        )}
      </div>
      {showDamageOverlay && <DamageOverlay />}
    </>
  );
}
