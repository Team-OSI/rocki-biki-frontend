'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
// import { Ring } from './Ring';
import { useMotionCapture } from '@/hooks/useMotionCapture';
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection';
// import { useGameLogic } from '../hooks/useGameLogic';
// import { useWebSocket } from '../hooks/useWebSocket';

function Scene({localVideoRef, remoteVideoRef, roomId}) {
//   const { gameState, updateGameState } = useGameLogic();
//   const { sendMessage, lastMessage } = useWebSocket();
  const [receivedPoseData, setReceivedPoseData] = useState([]);
  const [landmarks, setLandmarks] = useState({
    nose: null,
    leftEye: null,
    rightEye: null,
    leftHand: null,
    rightHand: null,
  })
  useMotionCapture(localVideoRef, setLandmarks);

  //webRTC receive
    const {  connectionState, remoteVideoRef: connectedRemoteVideoRef } = useWebRTCConnection(
      (receivedData) => {
        console.log('Received data:', receivedData);
        if (receivedData.type === 'pose') {
          setReceivedPoseData(receivedData.pose);
        }
      },
      () => landmarks,
      remoteVideoRef,
      roomId
    );
    
  // useFrame((state, delta) => {
    // 게임 상태 업데이트 로직
    // updateGameState(delta);
    // 필요한 경우 WebSocket을 통해 상태 전송
    // sendMessage(gameState);
  // });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1}/>
      <Player position={[0, 0, -2.6]} landmarks={landmarks} />
      <Opponent position={[0, 0, 3]} opponentData={receivedPoseData}/>
      <Environment files="/images/metro_noord_4k.hdr" background/>
      {/* <Ring /> */}
    </>
  );
}

export function GameCanvas({roomId}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // 임시코드
  const connectionState = 'conected'
  // const handleDataReceived = (receivedData) => {
  //   console.log('Received data:', receivedData);
  //   if (receivedData.type === 'pose') {
  //     setReceivedPoseData(receivedData.pose);
  //   }
  // };

  // const { connectionState, remoteVideoRef: connectedRemoteVideoRef } = useWebRTCConnection(
  //   handleDataReceived,
  //   () => landmarks,
  //   remoteVideoRef,
  //   roomId
  // );

  // useEffect(() => {
  //   if (connectedRemoteVideoRef.current) {
  //     remoteVideoRef.current = connectedRemoteVideoRef.current;
  //   }
  // }, [connectedRemoteVideoRef]);
  
  return (
    <div className="w-full h-screen">
      <video className='fixed scale-x-[-1] right-5 top-5 z-10 rounded-[50px] opacity-80' ref={localVideoRef} style={{ width: '200px', height: '150px' }} />
      {connectionState === 'conected' ? <video className='fixed scale-x-[-1] left-5 top-5 z-10 rounded-[50px] opacity-80' ref={remoteVideoRef} style={{ width: '200px', height: '150px' }} /> : <div className='fixed scale-x-[-1] left-5 bg-slate-400 top-5 z-10 rounded-[50px] opacity-80' style={{ width: '200px', height: '150px' }} />}
      <Canvas shadows>
        <color attach='background' args={["gray"]} />
        <ambientLight />
        <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
        <Scene localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} roomId={roomId}/>
        <Stats />
      </Canvas>
    </div>
  );
}