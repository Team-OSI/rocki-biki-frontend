'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Stats, PerspectiveCamera, useTexture, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import { useEffect, useState, useRef } from 'react';
import StateBar from './StateBar';
import { Ring } from './Ring';
import useGameStore from "@/store/gameStore";
import * as THREE from 'three'

const skillBackgrounds = {
  default: '/images/background.png',
  Attack: '/images/skill/attack_background.png',
  Heal: '/images/skill/heal_background.jpg',
  Shield: '/images/skill/shield_background.jpg',
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
  const [background, setBackground] = useState(skillBackgrounds.default);
  const [showBackground, setShowBackground] = useState(false);
  const gameStatus = useGameStore(state => state.gameStatus);
  const opponentSkills = useGameStore(state => state.opponentSkills);
  const playerSkills = useGameStore(state => state.playerSkills);
  const timerRef = useRef(null);

  useEffect(() => {
    if (gameStatus === 'skillTime') {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (opponentSkills || playerSkills) {
        let skill = null;

        // 우선 순위에 따라 널이 아닌 스킬을 선택
        if (opponentSkills && opponentSkills[0]) {
            skill = opponentSkills[0];
        } else if (playerSkills && playerSkills[0]) {
            skill = playerSkills[0];
        }

        if (skill) {
            setBackground(skillBackgrounds[skill] || skillBackgrounds.default);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                setBackground(skillBackgrounds.default);
                timerRef.current = null;
            }, 10000);
        }
    }
}, [opponentSkills, playerSkills]);


  return (
    <>
      <Player position={[0, 0, -2.5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 2.5]} landmarks={landmarks} opponentData={receivedPoseData} />
      <pointLight position={[0, 15, 0]} intensity={1} />
      <ambientLight intensity={1} />
      {showBackground ? (
        <>
          <ambientLight intensity={1} />
          <pointLight position={[0, 15, 0]} intensity={1} />
          <BackGround texturePath={background} />
        </>
      ) : (
        <>
          <Environment intensity={1} files="/images/kloppenheim_06_puresky_1k.hdr" background />
        </>
      )}
      <Ring scale={1.8}/>
    </>
  );
}

export default function GameCanvas({ receivedPoseData, landmarks }) {
  return (
    <>
      <StateBar />
      <Canvas
          dpr={[1, 2]}
          performance={{ min: 0.5 }}
          gl={{ 
            powerPreference: "high-performance", 
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.5 
          }}
      >
        <PerspectiveCamera makeDefault fov={30} position={[0, 0, 0]} />
        <Scene receivedPoseData={receivedPoseData} landmarks={landmarks}/>
        <Stats />
      </Canvas>
    </>
  );
}
