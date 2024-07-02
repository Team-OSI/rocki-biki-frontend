'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
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

  // Opponent를 위한 변형된 데이터 생성
  const opponentData = React.useMemo(() => {
    if (!landmarks.nose) return landmarks;
    
    const transformLandmark = (landmark) => {
      if (!landmark) return null;
      return {
        x: landmark.x, // X 좌표를 반전
        y: landmark.y,
        z: -landmark.z
      };
    };

    return {
      nose: transformLandmark(landmarks.nose),
      leftEye: transformLandmark(landmarks.leftEye),
      rightEye: transformLandmark(landmarks.rightEye),
      leftHand: landmarks.rightHand ? {
        wrist: transformLandmark(landmarks.rightHand.wrist),
        indexBase: transformLandmark(landmarks.rightHand.indexBase),
        pinkyBase: transformLandmark(landmarks.rightHand.pinkyBase)
      } : null,
      rightHand: landmarks.leftHand ? {
        wrist: transformLandmark(landmarks.leftHand.wrist),
        indexBase: transformLandmark(landmarks.leftHand.indexBase),
        pinkyBase: transformLandmark(landmarks.leftHand.pinkyBase)
      } : null,
    };
  }, [landmarks]);
    
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
      <Opponent position={[0, 0, 3]} opponentData={opponentData}/>
      <Environment files="/images/metro_noord_4k.hdr" background/>
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
        <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
        <Scene videoRef={videoRef}/>
        <OrbitControls />
        <Stats />
      </Canvas>
    </div>
  );
}