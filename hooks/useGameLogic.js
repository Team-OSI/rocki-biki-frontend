import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';

const useGameLogic = () => {
  const { roomId } = useParams();
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    players: {},
    round: 0,
    gameStarted: false,
    winner: null,
  });
  const [localPlayer, setLocalPlayer] = useState(null);

  // 소켓 연결 설정
  useEffect(() => {
    const newSocket = io('http://localhost:3001'); // 서버 URL을 적절히 변경하세요
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    socket.on('gameUpdate', handleGameUpdate);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStart', handleGameStart);
    socket.on('roundEnd', handleRoundEnd);
    socket.on('gameEnd', handleGameEnd);

    // 방에 입장
    socket.emit('joinRoom', roomId);

    return () => {
      socket.off('gameUpdate');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStart');
      socket.off('roundEnd');
      socket.off('gameEnd');
    };
  }, [socket, roomId]);

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

  // 액션 수행 (예: 펀치)
  const performAction = useCallback((action) => {
    if (socket) {
      socket.emit('playerAction', { roomId, playerId: localPlayer, action });
    }
  }, [socket, roomId, localPlayer]);

  // 게임 준비 상태 설정
  const setReady = useCallback(() => {
    if (socket) {
      socket.emit('playerReady', { roomId, playerId: localPlayer });
    }
  }, [socket, roomId, localPlayer]);

  return {
    gameState,
    localPlayer,
    performAction,
    setReady,
  };
};

export default useGameLogic;