import { useEffect, useState } from 'react';
import useGameStore from '../../store/gameStore'

export default function StateBar() {
  const { gameStatus, opponentHealth, playerHealth, setGameStatus, winner } = useGameStore();
  const [count, setCount] = useState(3000);

  useEffect(()=>{
    let timer;
    if (gameStatus === 'playing' && count > 0) {
      timer = setInterval(() => {
        setCount((prevCount) => prevCount - 1);
      }, 1000);
    } else if (count === 0 || gameStatus === 'finished') {
      clearInterval(timer);
      if (count === 0){
        setGameStatus('finished');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStatus, count, setGameStatus])

  useEffect(() => {
    if (gameStatus === 'playing') {
      setCount(3000);  // 게임 시작 시 카운트를 60초로 초기화
    }
  }, [gameStatus]);

  const handleRestart = () => {
    resetGame();
    setCount(60);
  }

  return (
    <div className='absolute z-50 top-1 w-full h-full'>
      <div className='absolute flex flex-row justify-between w-full h-full px-4'>
        <div className="w-2/5 bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
            style={{width: `${opponentHealth}%`}}
          ></div>
        </div>
        <div className='font-extrabold text-lg'>{count}</div>
        <div className="w-2/5 bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div 
            className="bg-red-600 h-2.5 rounded-full dark:bg-red-500" 
            style={{width: `${playerHealth}%`}}
          ></div>
        </div>
      </div>
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              {winner === 'player' ? '승리!' : winner === 'opponent' ? '패배!' : '시간 초과!'}
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