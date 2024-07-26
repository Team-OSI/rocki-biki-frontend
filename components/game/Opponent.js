'use client';

import { forwardRef, useRef, useEffect, useMemo, useState, useCallback, useImperativeHandle } from 'react'
import { useFrame} from '@react-three/fiber'
import { useGLTF, useTexture, Trail } from '@react-three/drei'
import * as THREE from 'three'
import useGaugeStore from '@/store/gaugeStore';
import useSocketStore from '@/store/socketStore';
import useGameStore from "@/store/gameStore";
import {getAudioUrls} from "@/api/user/api";
import PNGSequenceAnimation from './PNGSequence';

const slowMotionFactor = 0.2; // 0.2배 속도로 슬로우모션

function calculateSlowMotionFactor(time) {
  // 초기 1초 동안 급격히 느려짐
  if (time < 1) {
    return 0.1 + 0.9 * (1 - time);
  }
  // 그 다음 1초 동안 서서히 원래 속도로 돌아감
  else if (time < 2) {
    return 0.1 + 0.9 * (time - 1);
  }
  // 2초 이후에는 원래 속도
  else {
    return 1;
  }
}
// Opponent 전용 Head 컴포넌트
const OpponentHead = forwardRef(({ position, rotation, scale, name, hit, shield, shieldPer, isDead }, ref) => {
    const [deathAnimation, setDeathAnimation] = useState({ velocity: new THREE.Vector3(), rotation: new THREE.Euler() });
    const [deathTime, setDeathTime] = useState(null);
    const hasStartedDeathAnimation = useRef(false);
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/opponent-head.glb')
    const opacity = 1
    const [hitImpulse, setHitImpulse] = useState(new THREE.Vector3())
    const originalPosition = useRef(new THREE.Vector3());
    const currentVelocity = useRef(new THREE.Vector3())

    const adjustedScale = shield && shieldPer !== null
        ? scale * (1 - (shieldPer || 0) * 0.6)
        : scale;

    const opponentHealth = useGameStore(state => state.opponentHealth);

    // 텍스처 로드
    const textures = useTexture({
      default: 'images/textures/face_default.png',
      hit: 'images/textures/face_hit.png',
      hpUnder60: 'images/textures/face_HpUnder_60.png',
      hpUnder30: 'images/textures/face_HpUnder_30.png',
    })

    const currentTexture = useMemo(() => {
      if (hit) return textures.hit;
      if (opponentHealth <= 30) return textures.hpUnder30;
      if (opponentHealth <= 60) return textures.hpUnder60;
      return textures.default;
    }, [hit, opponentHealth, textures.hit, textures.hpUnder30, textures.hpUnder60, textures.default]);
  
    useImperativeHandle(
      ref,
      () => ({
        getWorldPosition: (target) => {
          if (localRef.current) {
            return localRef.current.getWorldPosition(target || new THREE.Vector3())
          }
          return new THREE.Vector3()
        },
        position: localRef.current?.position,
        rotation: localRef.current?.rotation,
        addHitImpulse: (impulse) => {
          if (!isDead) {
            setHitImpulse(prev => prev.add(impulse))
          }
        },}),
      [localRef], 
    )
  
    useEffect(() => {
      if (localRef.current && !isDead) {
        const newPos = new THREE.Vector3((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -(position.z+0.01) * 15)
        localRef.current.position.copy(newPos)
        originalPosition.current.copy(newPos)
        if (rotation) {
          localRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
      }
    }, [position, rotation])

    useEffect(() => {
      Object.values(materials).forEach((material) => {
        material.color.setRGB(hit ? 1 : 1, hit ? 0 : 1, hit ? 0 : 1) // Set color to red when hit
        material.map = currentTexture;
        material.roughness = 0.5;
        material.metalness = 0.5;
        material.needsUpdate = true;
      });
    }, [materials, currentTexture, hit]);

    useEffect(() => {
      if (isDead && deathTime === null) {
        setDeathTime(Date.now());
        // 죽음 애니메이션 초기화
        setDeathAnimation({
          velocity: new THREE.Vector3(Math.random() * 10 - 5, 15, Math.random() * 10 - 5),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        });
      }
    }, [isDead, deathTime]);

    useFrame((state, delta) => {
      if (localRef.current) {
        if (isDead && isDead && deathTime !== null) {
          const timeSinceDeath = (Date.now() - deathTime) / 1000; // 초 단위
          const slowMotionFactor = calculateSlowMotionFactor(timeSinceDeath);
          const slowDelta = delta * slowMotionFactor;

          // 죽음 애니메이션에 기존 hit 애니메이션의 로직 적용
          currentVelocity.current.add(deathAnimation.velocity.clone().multiplyScalar(slowDelta));
          localRef.current.position.add(currentVelocity.current.clone().multiplyScalar(slowDelta));

          // 회전 적용
          localRef.current.rotation.x += deathAnimation.rotation.x * slowDelta;
          localRef.current.rotation.y += deathAnimation.rotation.y * slowDelta;
          localRef.current.rotation.z += deathAnimation.rotation.z * slowDelta;

          // Spring force towards original position (약화된 버전)
          const displacement = localRef.current.position.clone().sub(originalPosition.current);
          const springForce = displacement.clone().multiplyScalar(-0.5); // 원래보다 약한 스프링 힘
          currentVelocity.current.add(springForce.multiplyScalar(slowDelta));

          // Damping (더 강한 감쇠)
          currentVelocity.current.multiplyScalar(0.95);

          // 중력 적용
          currentVelocity.current.y -= 9.8 * slowDelta;

          // z축 방향으로 밀어내기
          currentVelocity.current.z -= 2 * slowDelta;
        } else {
        // Apply hit impulse
        currentVelocity.current.add(hitImpulse)
        
        // Move head
        localRef.current.position.add(currentVelocity.current.clone().multiplyScalar(delta))
        
        // Spring force towards original position
        const displacement = localRef.current.position.clone().sub(originalPosition.current)
        const springForce = displacement.clone().multiplyScalar(-5) // Increase for stiffer spring
        currentVelocity.current.add(springForce.multiplyScalar(delta))
        
        // Damping
        currentVelocity.current.multiplyScalar(0.85) //0.94
        
        // Reset hit impulse
        setHitImpulse(new THREE.Vector3())
        }
      }
    })

    return (
      <group ref={localRef}>
      <primitive object={scene} scale={adjustedScale} name={name} />
      {opponentHealth <= 50 && (
        <PNGSequenceAnimation
          position={[-0.75, 1.33, 0]} 
          health={opponentHealth}
        />
      )}
      </group>
    )
  })
  
OpponentHead.displayName = "OpponentHead";

// Opponent 전용 Hand 컴포넌트
const OpponentHand = forwardRef(({ position, rotation, scale, name, isAttacking, isDead }, ref) => {
    const [deathAnimation, setDeathAnimation] = useState({ velocity: new THREE.Vector3(), rotation: new THREE.Euler() });
    const localRef = useRef()
    const { scene } = useGLTF(name === 'opponentLeftHand' ? '/models/left-hand.glb' : '/models/right-hand.glb')

    useEffect(() => {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color.set('blue');
        }
      });
    }, [scene]);
    useFrame((state, delta) => {
      if (localRef.current) {
        if (isDead) {
          // 슬로우모션 적용
          const slowDelta = delta * slowMotionFactor;
          // 죽음 애니메이션 적용
          deathAnimation.velocity.y -= 9.8 * slowDelta; // 중력 적용
          localRef.current.position.add(deathAnimation.velocity.clone().multiplyScalar(slowDelta));
          localRef.current.rotation.x += deathAnimation.rotation.x * slowDelta;
          localRef.current.rotation.y += deathAnimation.rotation.y * slowDelta;
          localRef.current.rotation.z += deathAnimation.rotation.z * slowDelta;
  
          // 부드러운 감속 추가
          deathAnimation.velocity.multiplyScalar(0.99);
          deathAnimation.rotation.x *= 0.99;
          deathAnimation.rotation.y *= 0.99;
          deathAnimation.rotation.z *= 0.99;

          // 바닥에 닿으면 멈춤
          if (localRef.current.position.y < -7.5) {
            localRef.current.position.y = 0;
            deathAnimation.velocity.set(0, 0, 0);
          }
        }
      }
    });
  
    useEffect(() => {
      if (isDead) {
        // 죽음 애니메이션 초기화
        setDeathAnimation({
          velocity: new THREE.Vector3(Math.random() * 5 - 2.5, 10, Math.random() * 5 - 2.5),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        });
      }
    }, [isDead]);

    useEffect(() => {
      if (localRef.current && position && !isDead) {
        if (rotation) {
          localRef.current.rotation.set(rotation[0],rotation[1],rotation[2])
        }
        localRef.current.position.set((position[0]-0.5)*4, -(position[1]-0.5)*4, -position[2]*30)
      }
    }, [position, rotation, isDead])
  
    return (
      <group ref={localRef}>
        <primitive object={scene.clone()} scale={scale} name={name} />
        {isAttacking && (
          <>
            <primitive object={new THREE.PointLight('blue', 100, 50)} />
            <Trail
              width={7}
              length={4}
              color={'blue'}
              attenuation={(t) => t * t}
            >
              <mesh visible={false}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial />
              </mesh>
            </Trail>
          </>
        )}
      </group>
    )
  })

OpponentHand.displayName = "OpponentHand";

export function Opponent({ position, landmarks, opponentData }) {
  const groupRef = useRef(null)
  const headRef = useRef(null)
  const [hit, setHit] = useState(false)
  const lastHitTime = useRef(0)
  const emitDamage = useSocketStore(state => state.emitDamage)
  const count_optm = useRef(0)
  const roomId = useRef('')
  const hitSoundRef = useRef(null);
  const voiceSoundRef = useRef(null);
  const opponentInfo = useGameStore(state => state.opponentInfo);
  const [audioUrls, setAudioUrls] = useState([]);


const [isDead, setIsDead] = useState(false);
const opponentHealth = useGameStore(state => state.opponentHealth);

useEffect(() => {
  if (opponentHealth <= 0 && !isDead) {
    setIsDead(true);
    console.log('sadfasdfsadf',isDead)
  }
}, [opponentHealth, isDead]);

  useEffect(() => {
    if (opponentInfo && opponentInfo.email) {
      const fetchAudioUrls = async () => {
        try {
          const urls = await getAudioUrls(opponentInfo);
          setAudioUrls(urls);
        } catch (err) {
          console.error('Error fetching audio URLs:', err);
        }
      };

      fetchAudioUrls();
    }
  }, [opponentInfo]);


  // 게이지 구현
  const { 
    resetGauge, 
    getGaugeDamage, 
  } = useGaugeStore();

  useEffect(() => {
    hitSoundRef.current = new Audio('./sounds/hit.MP3');
    voiceSoundRef.current = new Audio();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    roomId.current = searchParams.get('roomId');
  }, [roomId]);

  const playRandomVoice = useCallback(() => {
    if (audioUrls.length > 0 && voiceSoundRef.current) {
      const randomIndex = Math.floor(Math.random() * audioUrls.length);
      voiceSoundRef.current.src = audioUrls[randomIndex];
      voiceSoundRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  }, [audioUrls]);

  const playHitSound = useCallback(() => {
    if (hitSoundRef.current) {
      hitSoundRef.current.play().catch(e => console.error("Error playing hit sound:", e));
    }
    playRandomVoice(); // 히트 사운드와 함께 랜덤 보이스 재생
  }, [playRandomVoice]);

  const opponentSkills = useGameStore(state => state.opponentSkills);
  const shieldActive = opponentSkills[0] === 'Shield';
  const shieldPer = opponentSkills[1];
  const isAttacking = opponentSkills[0] === 'Attack' && opponentSkills[1] !== null;

  const checkHit = useCallback(() => {
    if(!headRef.current || !landmarks.leftHand || !landmarks.rightHand) return

    const headPosition = new THREE.Vector3()
    headRef.current.getWorldPosition(headPosition)

    const hands = [
      { landmark: landmarks.leftHand, name: 'left' },
      { landmark: landmarks.rightHand, name: 'right' }
    ];

    const currentTime = performance.now()

    hands.forEach(({ landmark, name }) => {
      // console.log(hand[2])
      // if(landmark[2] !== 0) return // 주먹상태인지 확인

      const handPosition = new THREE.Vector3(
        (landmark[0][0] - 0.5) * 4,
        -(landmark[0][1] - 0.5) * 4,
        -(landmark[0][2] * 30)
      )
      // Opponent의 회전을 적용합니다 (y축 주위로 180도 회전).
      // handPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      // Player의 위치 오프셋을 적용합니다.
      const distanceAdjustment = new THREE.Vector3(0, 0, -2.5); // 1 - (-5) = 6
      handPosition.add(distanceAdjustment);

      const distance = headPosition.distanceTo(handPosition)

      // Shield 활성화 시 유효 거리를 줄임
      const baseHitDistance = 1.3; // 기본거리
      const hitDistance = shieldActive && shieldPer !== null
          ? baseHitDistance * (1 - (shieldPer || 0) * 0.6)
          : baseHitDistance;
      
      if (distance < hitDistance && currentTime - lastHitTime.current > 1000) {
        // const velocity = landmark[0].reduce((sum, coord) => sum + Math.abs(coord), 0)
        const gaugeDamage = getGaugeDamage(name);
        const damage = gaugeDamage // + (Math.floor(velocity * 20) / 3);

        // 데미지 정보를 서버로 전송
        if (damage !== 0) {
          emitDamage(damage)
          playHitSound()
          setHit(true)
          lastHitTime.current = currentTime
          setTimeout(() => setHit(false), 500)
        }

        // 타격 위치 설정
        const hitDirection = handPosition.clone().sub(headPosition).normalize()
        const hitImpulse = hitDirection.multiplyScalar(40+damage) // 조절 가능한 힘
        headRef.current.addHitImpulse(hitImpulse)

        resetGauge(name)
      }
    })
  }, [landmarks, playHitSound, emitDamage, getGaugeDamage, resetGauge, shieldActive, shieldPer])

  useFrame(() => {
  if(count_optm.current % 4 === 0) {
    checkHit();
  }
  count_optm.current = (count_optm.current + 1) % 1000000;
  })


  return (
    <group ref={groupRef} position={position} rotation={[0, Math.PI, 0]}>
       {opponentData.head && (
        <OpponentHead
          ref={headRef}
          position={new THREE.Vector3(opponentData.head[0][0], opponentData.head[0][1], opponentData.head[0][2])}
          rotation={[0, -opponentData.head[1][1] * (Math.PI / 180), -opponentData.head[1][2] * (Math.PI / 180)]}
          scale={0.25}
          name='opponentHead'
          hit={hit}
          shield={shieldActive}
          shieldPer={shieldPer}
          isDead={isDead}
        />)}
        {opponentData.rightHand && (
          <OpponentHand
          position={opponentData.rightHand[0]}
          rotation={[(opponentData.rightHand[1][0]-Math.PI), Math.PI , -(opponentData.rightHand[1][1]-Math.PI/2)]}
            scale={0.33}
            name='opponentRightHand'
            isAttacking={isAttacking}
            isDead={isDead}
          />
        )}
        {opponentData.leftHand && (
          <OpponentHand
            position={opponentData.leftHand[0]}
            rotation={[-(opponentData.leftHand[1][0]-Math.PI), 0 ,-(opponentData.leftHand[1][1]+Math.PI/2)]}
            scale={0.33}
            name='opponentLeftHand'
            isAttacking={isAttacking}
            isDead={isDead}
          />
        )}
    </group>
  );
}

// 모델 미리 로드
useGLTF.preload('/models/opponent-head.glb');
useGLTF.preload('/models/left-hand.glb');
useGLTF.preload('/models/right-hand.glb');