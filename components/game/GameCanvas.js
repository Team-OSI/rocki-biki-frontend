'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats, PerspectiveCamera, Environment, Sky, useTexture } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import {useEffect, useState} from 'react';
import useGameStore from '@/store/gameStore';
import StateBar from './StateBar';
import useSocketStore from "@/store/socketStore";

const skillBackgrounds = {
  default: '/images/default_background.jpg',
  attack: '/images/attack_background.png',
  heal: '/images/heal_background.jpg',
  shield: '/images/shield_background.jpg',
};

function BackGround( { texturePath }) {
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

function Scene({receivedPoseData, landmarks, socket}) {
  const decreasePlayerHealth = useGameStore(state => state.decreasePlayerHealth)
  const [background, setBackground] = useState(skillBackgrounds.default);
  const opponentSkill = useSocketStore(state => state.opponentSkill)

  useEffect(() => {
    if (opponentSkill) {
      setBackground(skillBackgrounds[opponentSkill.skillType] || skillBackgrounds.default);
    }
  }, [opponentSkill]);

  useEffect(() => {
    if (socket) {
      const handleOpponentSkillUsed = ({ skillType }) => {
        console.log('Opponent used skill:', skillType);
      };

      socket.on('opponentSkillUsed', handleOpponentSkillUsed);

      return () => {
        socket.off('opponentSkillUsed');
      };
    }
  }, [socket, decreasePlayerHealth]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -2.5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 2.5]} landmarks={landmarks} opponentData={receivedPoseData} socket={socket}/>
      {/*<Environment preset='sunset' background />*/}
      <BackGround texturePath={background} />
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
      <Scene receivedPoseData={receivedPoseData} landmarks={landmarks}/>
      <Stats />
    </Canvas>
  </>
  );
}
