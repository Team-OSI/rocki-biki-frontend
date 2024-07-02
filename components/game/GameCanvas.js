'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
// import { Ring } from './Ring';
import { useMotionCapture } from '@/hooks/useMotionCapture';
// import { useGameLogic } from '../hooks/useGameLogic';
// import { useWebSocket } from '../hooks/useWebSocket';

function Scene({localVideoRef, remotevideoRef}) {
//   const { gameState, updateGameState } = useGameLogic();
//   const { sendMessage, lastMessage } = useWebSocket();
  const [landmarks, setLandmarks] = useState({
    nose: null,
    leftEye: null,
    rightEye: null,
    leftHand: null,
    rightHand: null,
  })
  useMotionCapture(localVideoRef, setLandmarks);

    
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
      <Opponent position={[0, 0, 3]} opponentData={landmarks}/>
      <Environment files="/images/metro_noord_4k.hdr" background/>
      {/* <Ring /> */}
    </>
  );
}

export function GameCanvas({roomId}) {
  const localVideoRef = useRef(null);
  const remotevideoRef = useRef(null);
  return (
    <div className="w-full h-screen">
      <video className='fixed scale-x-[-1] right-5 top-5 z-10 rounded-[50px] opacity-80' ref={localVideoRef} style={{ width: '200px', height: '150px' }} />
      <Canvas shadows>
        <color attach='background' args={["gray"]} />
        <ambientLight />
        <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
        <Scene localVideoRef={localVideoRef}/>
        <OrbitControls />
        <Stats />
      </Canvas>
    </div>
  );
}