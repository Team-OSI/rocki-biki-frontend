'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import { useSearchParams } from 'next/navigation';
import { useMotionCapture } from '@/hooks/useMotionCapture';
import useWebRTCConnection from '@/hooks/useWebRTCConnection';
import { startRecognition, getRecognition } from '@/api/stt/api';

// 씬 컴포넌트
function Scene({ localVideoRef, remoteVideoRef }) {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const [receivedPoseData, setReceivedPoseData] = useState({});
  const [landmarks, setLandmarks] = useState({
    nose: null,
    leftEye: null,
    rightEye: null,
    leftHand: null,
    rightHand: null,
  });
  const landmarksRef = useRef(landmarks);

  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  useMotionCapture(localVideoRef, setLandmarks);

  useWebRTCConnection(
    roomId,
    localVideoRef,
    remoteVideoRef,
    (receivedData) => {
      if (receivedData.type === 'pose') {
        setReceivedPoseData(receivedData.pose);
      }
    },
    () => landmarksRef.current
  );

  useFrame((state, delta) => {});

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -2.6]} landmarks={landmarks} />
      <Opponent position={[0, 0, 3]} opponentData={receivedPoseData} />
      <Environment files="/images/metro_noord_4k.hdr" background />
    </>
  );
}

// 게임 캔버스 컴포넌트
export function GameCanvas() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const connectionState = 'connected';

  return (
    <div className="w-full h-screen">
      <video
        className="fixed scale-x-[-1] right-5 top-5 z-10 rounded-[50px] opacity-80"
        ref={localVideoRef}
        style={{ width: '200px', height: '150px' }}
        autoPlay
        playsInline
      />
      {connectionState === 'connected' ? (
        <video
          className="fixed scale-x-[-1] left-5 top-5 z-10 rounded-[50px] opacity-80"
          ref={remoteVideoRef}
          style={{ width: '200px', height: '150px' }}
          autoPlay
          playsInline
        />
      ) : (
        <div
          className="fixed scale-x-[-1] left-5 bg-slate-400 top-5 z-10 rounded-[50px] opacity-80"
          style={{ width: '200px', height: '150px' }}
        />
      )}
      <Canvas shadows>
        <color attach="background" args={["gray"]} />
        <ambientLight />
        <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
        <Scene localVideoRef={localVideoRef} remoteVideoRef={remoteVideoRef} />
        <Stats />
      </Canvas>
    </div>
  );
}