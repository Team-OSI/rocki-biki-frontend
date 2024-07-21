import styled, { keyframes, css } from 'styled-components';
import { useEffect, useState } from 'react';
import useGameStore from '../../store/gameStore'
import useSocketStore from '@/store/socketStore';


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
  ${props => props.isRed && css`
    filter: brightness(0) saturate(100%) invert(22%) sepia(95%) saturate(5333%) hue-rotate(356deg) brightness(97%) contrast(122%);
  `}
  ${props => props.isOrange && css`
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
  const isRed = count <=10
  const isOrange = count > 10 && count <= 30;

  useEffect(() => {
    setTens(Math.floor(count / 10));
    setOnes(count % 10);
  }, [count]);

  return (
    <TimerContainer>
      <DigitImage src={`/images/count/${tens}.png`}  isRed={isRed} isOrange={isOrange}/>
      <DigitImage src={`/images/count/${ones}.png`} isRed={isRed} isOrange={isOrange}/>
    </TimerContainer>
  );
};
const decreaseAnimation = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`
export default function StateBar() {
  const { gameStatus, opponentHealth, playerHealth, winner } = useGameStore();
  const socket = useSocketStore(state => state.socket);
  const [count, setCount] = useState(60);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    preloadImages()
      .then(() => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error preloading images:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let timer;
    if (gameStatus === 'playing' && count > 0  && !isLoading) {
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
    if (gameStatus === 'playing') {
      setCount(60);  // 게임 시작 시 카운트를 120초로 초기화
    } 
  }, [gameStatus]);

  const handleRestart = () => {
    // resetGame();
    setCount(60);
  }

  return (
    <div className='absolute z-50 top-1 w-full h-full'>
      <div className='absolute flex flex-row justify-between w-full h-full px-4'>
        <div className="w-2/5 bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-4 rounded-full dark:bg-blue-500" 
            style={{width: `${opponentHealth}%`}}
          ></div>
        </div>
        <div className='font-custom text-lg'>
          <Timer count={count} />
        </div>
        <div className="w-2/5 bg-gray-200 rounded-full h-4 mb-4 dark:bg-gray-700">
          <div 
            className="bg-red-600 h-4 rounded-full dark:bg-red-500" 
            style={{width: `${playerHealth}%`}}
          ></div>
        </div>
      </div>
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              {winner === socket.id ? '승리!' :  '패배!'}
            </h2>
            <button 
              onClick={handleRestart}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              재시작
            </button>
          </div>
        </div>
      )}
    </div>
  )
}