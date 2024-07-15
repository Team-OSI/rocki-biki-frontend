import { useEffect, useCallback, useState } from 'react';
import useSocketStore from '@/store/socketStore';
import useGameStore from '@/store/gameStore';

import socketStore from "@/store/socketStore";

const useGameLogic = () => {
    const [roomId, setRoomId] = useState(null);
  const {
    playerName,
    opponentHealth,
    playerHealth,
    opponentName,
    setPlayerName,
    opponentReady,
    setOpponentName,
    opponentReadyState,
    setOpponentReady,
    startGame,
    gameStatus,
    endGame,
    resetGame,
    decreasePlayerHealth,
    decreaseOpponentHealth,
    getWinner
  } = useGameStore();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRoomId(searchParams.get('roomId'));
  }, []);
  // 소켓 연결 설정
  const socket = useSocketStore(state => state.socket);

  const useSkill = socketStore(state=> state.useSkill);
  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    socket.on('gameUpdate', handleGameUpdate);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStart', handleGameStart);
    socket.on('roundEnd', handleRoundEnd);
    socket.on('gameEnd', handleGameEnd);
    socket.on('damage', handleDamage);
    socket.on('opponentIsReady', handleOpponentReady);

    return () => {
      socket.off('gameUpdate');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStart');
      socket.off('roundEnd');
      socket.off('gameEnd');
      socket.off('damage', handleDamage);
      socket.off('opponentIsReady');
    };
  }, [socket]);

  // 게임 상태 업데이트 처리
  const handleGameUpdate = useCallback((newState) => {
    setGameState(newState);
  }, []);

  // 플레이어 입장 처리
  const handlePlayerJoined = useCallback((player) => {
    setGameState(prev => ({
      ...prev,
      players: { ...prev.players, [player.id]: player }
    }));
  }, []);

  // 플레이어 퇴장 처리
  const handlePlayerLeft = useCallback((playerId) => {
    setGameState(prev => {
      const newPlayers = { ...prev.players };
      delete newPlayers[playerId];
      return { ...prev, players: newPlayers };
    });
  }, []);

  // 게임 시작 처리
  const handleGameStart = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStarted: true }));
  }, []);

  // 라운드 종료 처리
  const handleRoundEnd = useCallback((roundResult) => {
    setGameState(prev => ({ ...prev, round: prev.round + 1 }));
    // 라운드 결과에 따른 추가 로직
  }, []);

  // 게임 종료 처리
  const handleGameEnd = useCallback((result) => {
    setGameState(prev => ({ ...prev, gameStarted: false, winner: result.winner }));
  }, []);


  const handleDamage = (data) => {
    if (socket) {
      const curGameStatus = useGameStore.getState().gameStatus;
        if(curGameStatus === 'playing'){
          decreasePlayerHealth(data.amount);
        }
      }
  }

  // 상대플레이어 상태 받기
  const handleOpponentReady = (data) => {
    if (socket) {
      console.log("setOpponentReady: ",data)
      setOpponentReady(data);
    }
  }

  const skillUseFunction = useSkill();
  const handleUseSkill = useCallback((skillType) => {
    skillUseFunction(skillType, roomId);
  }, [skillUseFunction, roomId]);

  return {
    gameStatus,
    startGame,
      handleUseSkill,
  };
};

export default useGameLogic;