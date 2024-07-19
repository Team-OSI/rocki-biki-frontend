'use client';

import { forwardRef, useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react'
import { useFrame} from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGaugeStore from '@/store/gaugeStore';
import useSocketStore from '@/store/socketStore';
import useGameStore from "@/store/gameStore";
import {getAudioUrls} from "@/api/user/api";




// Opponent 전용 Head 컴포넌트
const OpponentHead = forwardRef(({ position, rotation, scale, name, hit }, ref) => {
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/opponent-head.glb')
    const opacity = 0.9
    const [hitImpulse, setHitImpulse] = useState(new THREE.Vector3())
    const originalPosition = useRef(new THREE.Vector3());
    const currentVelocity = useRef(new THREE.Vector3())

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
        addHitImpulse: (impulse) => setHitImpulse(prev => prev.add(impulse)),
      }),
      [localRef], 
    )
  
    useEffect(() => {
      if (localRef.current) {
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
        material.transparent = true
        material.opacity = opacity
        material.color.setRGB(hit ? 1 : 1, hit ? 0 : 1, hit ? 0 : 1) // Set color to red when hit
      })
    }, [materials, hit])

    useFrame((state, delta) => {
      if (localRef.current) {
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
    })

    return <primitive ref={localRef} object={scene} scale={scale} name={name} />
  })
  
OpponentHead.displayName = "OpponentHead";

// Opponent 전용 Hand 컴포넌트
const OpponentHand = forwardRef(({ position, rotation, scale, name }, ref) => {
    const localRef = useRef()
    const { scene } = useGLTF(name === 'opponentLeftHand' ? '/models/left-hand.glb' : '/models/right-hand.glb')

    useEffect(() => {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color.set('red');
        }
      });
    }, [scene]);

    useEffect(() => {
      if (localRef.current && position) {
        if (rotation) {
          localRef.current.rotation.set(rotation[0],rotation[1],rotation[2])
        }
        localRef.current.position.set((position[0]-0.5)*4, -(position[1]-0.5)*4, -position[2]*30)
      }
    }, [position, rotation])
  
    return <primitive ref={localRef} object={scene.clone()} scale={scale} name={name} />
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
      if(landmark[2] !== 0) return // 주먹상태인지 확인

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

      if (distance < 1.4 && currentTime - lastHitTime.current > 1000) {
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
  }, [landmarks, playHitSound, emitDamage, getGaugeDamage, resetGauge])

  useFrame(() => {
  if(count_optm.current % 2 === 0) {
    checkHit();
  }
  if (count_optm.current > 1000000) count_optm.current = 0;
  count_optm.current++;
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
        />)}
        {opponentData.rightHand && (
          <OpponentHand
          position={opponentData.rightHand[0]}
          rotation={[(opponentData.rightHand[1][0]-Math.PI), Math.PI , -(opponentData.rightHand[1][1]-Math.PI/2)]}
            scale={0.33}
            name='opponentRightHand'
          />
        )}
        {opponentData.leftHand && (
          <OpponentHand
            position={opponentData.leftHand[0]}
            rotation={[-(opponentData.leftHand[1][0]-Math.PI), 0 ,-(opponentData.leftHand[1][1]+Math.PI/2)]}
            scale={0.33}
            name='opponentLeftHand'
          />
        )}
    </group>
  );
}

// 모델 미리 로드
useGLTF.preload('/models/head.glb');
useGLTF.preload('/models/left-hand.glb');
useGLTF.preload('/models/right-hand.glb');