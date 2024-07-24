import { useEffect, useCallback } from 'react';
import useSocketStore from '@/store/socketStore';
import useGameStore from '@/store/gameStore';

const useGameLogic = () => {
  const { setGameStatus, gameStatus, setOpponentInfo, setRoomInfo } = useGameStore();
  const useSkill = useSocketStore(state => state.useSkill);
  // 소켓 연결 설정
  const socket = useSocketStore(state => state.socket);
  // const castSkill = useSocketStore(state => state.useSkill);


  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    socket.on('gameState', handleGameUpdate);
    socket.on('opponentInfo', handleOpponentInfo);
    socket.on('roomInfo', handleRoomInfo);

    return () => {
      socket.off('gameState');
      socket.off('opponentInfo')
      socket.off('roomInfo');
    };
  }, [socket]);

  // 게임 상태 업데이트 처리
  const handleGameUpdate = useCallback((newState) => {
    console.log('게임 상태 업데이트 처리: ', newState)
    setGameStatus(newState, socket.id);
  }, [setGameStatus, socket]);

  const handleOpponentInfo = useCallback((info) => {
    setOpponentInfo(info);
  }, [setOpponentInfo, socket])

  const handleRoomInfo = useCallback((room) => {
    setRoomInfo(room);
    console.log(room);
  }, [setRoomInfo,socket])
  // const handleCastSkill = useCallback((newState) => {
  //   console.log("skill:",newState);
  //   setGameStatus(newState, socket.id);
  // }, [socket]);

  // const handleUseSkill = useCallback((skillType) => {
  //   skillUseFunction(skillType);
  // }, [skillUseFunction]);

  // // 플레이어 입장 처리
  // const handlePlayerJoined = useCallback((player) => {
  //   setGameState(prev => ({
  //     ...prev,
  //     players: { ...prev.players, [player.id]: player }
  //   }));
  // }, []);

  // // 플레이어 퇴장 처리
  // const handlePlayerLeft = useCallback((playerId) => {
  //   setGameState(prev => {
  //     const newPlayers = { ...prev.players };
  //     delete newPlayers[playerId];
  //     return { ...prev, players: newPlayers };
  //   });
  // }, []);

  // // 게임 시작 처리
  // const handleGameStart = useCallback(() => {
  //   setGameState(prev => ({ ...prev, gameStarted: true }));
  // }, []);

  // // 라운드 종료 처리
  // const handleRoundEnd = useCallback((roundResult) => {
  //   setGameState(prev => ({ ...prev, round: prev.round + 1 }));
  //   // 라운드 결과에 따른 추가 로직
  // }, []);

  // // 게임 종료 처리
  // const handleGameEnd = useCallback((result) => {
  //   setGameState(prev => ({ ...prev, gameStarted: false, winner: result.winner }));
  // }, []);


  // const handleDamage = (data) => {
  //   if (socket) {
  //     const curGameStatus = useGameStore.getState().gameStatus;
  //       if(curGameStatus === 'playing'){
  //         decreasePlayerHealth(data.amount);
  //       }
  //     }
  // }

  // // 상대플레이어 상태 받기
  // const handleOpponentReady = (data) => {
  //   if (socket) {
  //     console.log("setOpponentReady: ",data)
  //     setOpponentReady(data);
  //   }
  // }

  const skillUseFunction = useSkill();
  const handleUseSkill = useCallback((skillType) => {
    skillUseFunction(skillType);
  }, [skillUseFunction]);

  return {
    gameStatus,
    handleUseSkill,
    handleRoomInfo
  };
};

export default useGameLogic;