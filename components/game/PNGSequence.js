import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PNGSequenceAnimation = ({ position, health }) => {
  const meshRef = useRef();
  const [textures, setTextures] = useState([]);
  const [currentTexture, setCurrentTexture] = useState(null);
  const frameCount = 17; // sweat_000부터 sweat_016까지
  const currentFrame = useRef(0);
  const lastUpdateTime = useRef(0);

  // 체력에 따른 애니메이션 속도 계산
  const animationSpeed = useMemo(() => {
    if (health > 50) return 0;
    return Math.max(0.1, (50 - health) / 50); // 0.1 ~ 1 사이의 값
  }, [health]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadedTextures = [];
    for (let i = 5; i < frameCount; i++) {
      const texture = loader.load(`/images/sweat/sweat_${i.toString().padStart(3, '0')}.png`);
      loadedTextures.push(texture);
    }
    setTextures(loadedTextures);
    setCurrentTexture(loadedTextures[0]);
  }, []);

  useFrame((state) => {
    if (health <= 50 && textures.length > 0) {
      const time = state.clock.getElapsedTime();
      if (time - lastUpdateTime.current > (1 - animationSpeed) * 0.1) { // 속도 조절
        currentFrame.current = (currentFrame.current + 1) % frameCount;
        setCurrentTexture(textures[currentFrame.current]);
        lastUpdateTime.current = time;
      }
    }
  });

  if (!currentTexture || health > 50) return null;

  return (
    <mesh 
        ref={meshRef} 
        position={position}
        rotation={[0, 0, Math.PI / 4]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={currentTexture} 
        transparent={true}
        opacity={0.8}
        side={THREE.DoubleSide}
         />
    </mesh>
  );
};

export default PNGSequenceAnimation;