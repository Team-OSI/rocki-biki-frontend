'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import { useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import StateBar from './StateBar';


function Scene({receivedPoseData, landmarks, socket}) {
  const decreasePlayerHealth = useGameStore(state => state.decreasePlayerHealth)
  useFrame((state, delta) => {

  });

  useEffect(() => {
    if (socket) {
      // console.log('Socket connected:', socket.connected)
      socket.on('connect', () => console.log('Socket connected'))
      socket.on('disconnet', () => console.log('Socket disconnected'))
      socket.on('damage', (data) => {
        // console.log('Damage received:', data)
        decreasePlayerHealth(data.amount);
      });
  
      return () => {
        socket.off('damage');
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket, decreasePlayerHealth]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -2.5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 2.5]} landmarks={landmarks} opponentData={receivedPoseData} socket={socket}/>
      <Environment preset='sunset' background />
    </>
  );
}

export function GameCanvas({ receivedPoseData, landmarks, socket }) {
  return (
  <>
  <StateBar />
    <Canvas shadows>
      <ambientLight />
      <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
      <Scene receivedPoseData={receivedPoseData} landmarks={landmarks} socket={socket} />
      {/* <Stats /> */}
    </Canvas>
  </>
  );
}
