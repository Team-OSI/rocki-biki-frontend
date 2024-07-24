import styled, { keyframes, css } from 'styled-components';
import { useEffect, useState, useRef, useCallback } from 'react';
import useGameStore from '../../store/gameStore';
import useSocketStore from '@/store/socketStore';
import useGameLogic from '@/hooks/useGameLogic';
import Confetti from 'react-confetti';

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

const preloadImages = () => {
  return new Promise((resolve, reject) => {
    const imageUrls = Array.from({ length: 10 }, (_, i) => `/images/count/${i}.png`);
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

const Timer = ({ count }) => {
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
      <DigitImage src={`/images/count/${tens}.png`} $isRed={isRed} $isOrange={isOrange} />
      <DigitImage src={`/images/count/${ones}.png`} $isRed={isRed} $isOrange={isOrange} />
    </TimerContainer>
  );
};

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
    ? 'rgba(220, 38, 38, 0.8)' // 진한 빨강 (player)
    : 'rgba(37, 99, 235, 0.8)' // 진한 파랑 (opponent)
  };
  transition: transform 0.5s ease-out;
  z-index: 1;
`;

const pulseAnimation = keyframes`
  0% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
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

export default function StateBar() {
  const { gameStatus, opponentHealth, playerHealth, winner, roomInfo } = useGameStore();
  const socket = useSocketStore(state => state.socket);
  const [count, setCount] = useState(60);
  const [pausedCount, setPausedCount] = useState(60); // 멈춘 시간 추적 상태
  const [isLoading, setIsLoading] = useState(true);
  const damageAudio = useRef(null);
  const { handleRoomInfo } = useGameLogic();
  const [nickname, setNickname] = useState('');
  const setIsLoadingImages = useGameStore(state => state.setIsLoadingImages);

  const playDamageSound = useCallback(() => {
    if (damageAudio.current) {
      damageAudio.current.currentTime = 0;
      damageAudio.current.play().catch(error => console.log('오디오 재생 실패:', error));
    }
  }, []);

  useEffect(() => {
    if (roomInfo && socket.id && roomInfo.playerInfo && roomInfo.playerInfo.length) {
      const player = roomInfo.playerInfo.find(p => p.socketId === socket.id);
      if (player) {
        setNickname(player.nickname);
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
    if (gameStatus === 'playing' && count === 60) {
      setCount(pausedCount); // 게임 상태가 'playing'으로 전환될 때 이전에 멈춘 시간을 설정
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === 'skilltime') {
      setPausedCount(count); // 게임 상태가 'skilltime'으로 전환될 때 남은 시간을 저장
    }
  }, [gameStatus, count]);

  const handleRestart = () => {
    setCount(60);
    setPausedCount(60); // 재시작 시 타이머 초기화
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
      {gameStatus === 'finished' && winner === socket.id && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={500}
          recycle={true}
        />
      )}
      {gameStatus === 'finished' && winner !== socket.id && renderRainEffect()}
      <div className='absolute z-50 top-1 w-full h-full'>
        <div className='absolute flex flex-row justify-between w-full h-full px-4'>
          <div className="w-2/5 bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700">
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
            <Timer count={count} />
          </div>
          <div className="w-2/5 bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700">
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
        {gameStatus === 'finished' && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-white p-16 rounded-3xl text-center shadow-2xl w-1/5 mx-auto relative"
                 style={{backgroundImage: 'url("/images/result_background.png")', backgroundSize: 'cover'}}>
              <h2 className={`text-6xl font-extrabold mb-8 animate-pulse`}
                style={{
                  background: winner === socket.id
                    ? 'linear-gradient(90deg, rgba(34,193,195,1) 0%, rgba(253,187,45,1) 100%)'
                    : 'linear-gradient(90deg, rgba(255,0,150,1) 0%, rgba(0,204,255,1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '2px 2px 5px rgba(0,0,0,0.5)', 
                }}>
                {winner === socket.id ? '승리!' : '패배!'}
              </h2>
              <h3
                className="text-7xl mb-12"
                style={{
                  background: 'linear-gradient(to right, #32CD32, #ADFF2F)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '2px 2px 5px rgba(0,0,0,0.5)',
                  fontWeight: 'bold',
                }}
              >
                {nickname}
              </h3>
              <button
                onClick={handleRestart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                style={{
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                재시작
              </button>
            </div>
          </div>
        )}
      </div>
      {showDamageOverlay && <DamageOverlay />}
    </>
  );
}
