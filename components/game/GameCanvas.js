'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';

function Scene({receivedPoseData, landmarks}) {
  useFrame((state, delta) => {
    console.log('===>', landmarks);
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 1]} opponentData={receivedPoseData} />
      <Environment preset='sunset' background />
    </>
  );
}

export function GameCanvas({ receivedPoseData, landmarks }) {
  return (
    <Canvas shadows>
      <color attach="background" args={["gray"]} />
      <ambientLight />
      <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
      <Scene receivedPoseData={receivedPoseData} landmarks={landmarks} />
      <Stats />
    </Canvas>
  );
}
