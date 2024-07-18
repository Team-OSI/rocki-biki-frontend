'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment, useTexture } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import { useEffect, useState, useRef } from 'react';
import useGameStore from '@/store/gameStore';
import StateBar from './StateBar';
import useSocketStore from "@/store/socketStore";
import { Ring } from './Ring';

const skillBackgrounds = {
  default: '/images/default_background.jpg',
  attack: '/images/attack_background.png',
  heal: '/images/heal_background.jpg',
  shield: '/images/shield_background.jpg',
};

function BackGround({ texturePath }) {
  const texture = useTexture(texturePath);
  const { scene } = useThree();

  useEffect(() => {
    scene.background = texture;
    return () => {
      scene.background = null;
    };
  }, [scene, texture]);

  return null;
}

function Scene({ receivedPoseData, landmarks, socket }) {
  const decreasePlayerHealth = useGameStore(state => state.decreasePlayerHealth);
  const [background, setBackground] = useState(skillBackgrounds.default);
  const opponentSkill = useSocketStore(state => state.opponentSkill);
  const timerRef = useRef(null);

  useEffect(() => {
    if (opponentSkill) {
      console.log(opponentSkill);
      setBackground(skillBackgrounds[opponentSkill.skillType] || skillBackgrounds.default);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Set a new timer to reset the background after 10 seconds
      timerRef.current = setTimeout(() => {
        setBackground(skillBackgrounds.default);
        timerRef.current = null;
      }, 10000);
    }
  }, [opponentSkill]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -2.5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 2.5]} landmarks={landmarks} opponentData={receivedPoseData} socket={socket} />
      {/* <Environment preset='sunset' background /> */}
      <BackGround texturePath={background} />
      <Ring />
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
        <Stats />
      </Canvas>
    </>
  );
}
