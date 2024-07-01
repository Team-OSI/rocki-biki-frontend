'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Player } from './Player';
// import { Opponent } from './Opponent';
// import { Ring } from './Ring';
import { useMotionCapture } from '../hooks/useMotionCapture';
// import { useGameLogic } from '../hooks/useGameLogic';
// import { useWebSocket } from '../hooks/useWebSocket';

function Scene({videoRef}) {
//   const { gameState, updateGameState } = useGameLogic();
//   const { sendMessage, lastMessage } = useWebSocket();
  const [landmarks, setLandmarks] = useState({
    nose: null,
    leftEye: null,
    rightEye: null,
    leftHand: null,
    rightHand: null,
  })
  useMotionCapture(videoRef, setLandmarks);

  // useFrame((state, delta) => {
    // 게임 상태 업데이트 로직
    // updateGameState(delta);
    // 필요한 경우 WebSocket을 통해 상태 전송
    // sendMessage(gameState);
  // });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Player position={[0, 0, 0]} landmarks={landmarks} />
      {/* <Opponent position={[2, 0, 0]} /> */}
      {/* <Ring /> */}
    </>
  );
}

export function GameCanvas() {
  const videoRef = useRef(null);
  return (
    <div className="w-full h-screen">
      <video className='fixed scale-x-[-1] right-5 top-5 z-10 rounded-[50px] opacity-80' ref={videoRef} style={{ width: '200px', height: '150px' }} />
      <Canvas shadows>
        <color attach='background' args={["gray"]} />
        <ambientLight />
        <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
        <Scene videoRef={videoRef}/>
        <OrbitControls />
        <gridHelper />
        <Stats />
      </Canvas>
    </div>
  );
}