'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Stats, PerspectiveCamera, useTexture, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Opponent } from './Opponent';
import { useEffect, useState, useRef } from 'react';
import StateBar from './StateBar';
import { Ring } from './Ring';
import useGameStore from "@/store/gameStore";

const skillBackgrounds = {
  default: '/images/default_background.jpg',
  Attack: '/images/attack_background.png',
  Heal: '/images/heal_background.jpg',
  SVGAnimateElementhield: '/images/shield_background.jpg',
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
  // const opponentSkill = useSocketStore(state => state.opponentSkill);
  const opponentSkills = useGameStore(state => state.opponentSkills);
  const playerSkills = useGameStore(state => state.playerSkills);
  const timerRef = useRef(null);

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
            console.log(skill);
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
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Player position={[0, 0, -2.5]} landmarks={landmarks} />
      <Opponent position={[0, 0, 2.5]} landmarks={landmarks} opponentData={receivedPoseData} />
      <Ring scale={2}/>
      <BackGround texturePath={background} />
      {/* <Environment preset='sunset' background /> */}
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
          gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <ambientLight />
        <PerspectiveCamera makeDefault fov={70} position={[0, 0, 0]} />
        <Scene receivedPoseData={receivedPoseData} landmarks={landmarks}/>
        {/* <Stats /> */}
      </Canvas>
    </>
  );
}
