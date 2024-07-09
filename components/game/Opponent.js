'use client';

import { forwardRef, useRef, useEffect, useState, useCallback, useImperativeHandle } from 'react'
import { useFrame} from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../../store/gameStore';

// 전역 객체 생성
const hitSound = new Audio('/sounds/hit.mp3');

// Opponent 전용 Head 컴포넌트
const OpponentHead = forwardRef(({ position, rotation, scale, name, hit }, ref) => {
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/opponent-head.glb')
    const opacity = 0.9
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
      }),
      [localRef], 
    )
  
    useEffect(() => {
      if (localRef.current) {
        localRef.current.position.set((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -(position.z+0.01) * 15)
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
          child.material = child.material.clone()
          child.material.color.set('red')
        }
      });
    }, [scene]);

    useFrame(() => {
      if (localRef.current && position) {
        if (rotation) {
          localRef.current.rotation.set(rotation[0],rotation[1],rotation[2])
        }
        localRef.current.position.set((position[0]-0.5)*4, -(position[1]-0.5)*4, -position[2]*30)
      }
    })
  
    return <primitive ref={localRef} object={scene.clone()} scale={scale} name={name} />
  })

OpponentHand.displayName = "OpponentHand";

export function Opponent({ position, landmarks, opponentData, socket }) {
  const groupRef = useRef(null)
  const headRef = useRef(null)
  const [hit, setHit] = useState(false)
  const lastHitTime = useRef(0)
  const decreaseOpponentHealth = useGameStore((state) => state.decreaseOpponentHealth)
  const count_optm = useRef(0)
  const roomId = useRef('')

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    roomId.current = searchParams.get('roomId');
  }, [roomId]);

  const playHitSound = useCallback(() => {
    hitSound.play()
  }, []);

  const checkHit = useCallback(() => {
    if(!headRef.current || !landmarks.leftHand || !landmarks.rightHand) return

    const headPosition = new THREE.Vector3()
    headRef.current.getWorldPosition(headPosition)

    const hands = [landmarks.leftHand, landmarks.rightHand]
    const currentTime = performance.now()

    hands.forEach((hand, index) => {
      // console.log(hand[2])
      if(hand[2] !== 0) return // 주먹상태인지 확인

      const handPosition = new THREE.Vector3(
        (hand[0][0] - 0.5) * 4,
        -(hand[0][1] - 0.5) * 4,
        -(hand[0][2] * 30)
      )
      // Opponent의 회전을 적용합니다 (y축 주위로 180도 회전).
      // handPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      // Player의 위치 오프셋을 적용합니다.
      const distanceAdjustment = new THREE.Vector3(0, 0, -2.5); // 1 - (-5) = 6
      handPosition.add(distanceAdjustment);

      const distance = headPosition.distanceTo(handPosition)

      if (distance < 1.3 && currentTime - lastHitTime.current > 1000) {
        const velocity = hand[0].reduce((sum, coord) => sum + Math.abs(coord), 0)
        const damage = Math.floor(velocity * 10)

        setHit(true)
        decreaseOpponentHealth(damage)
        
        // 데미지 정보를 서버로 전송
        if(socket){
          // console.log('Emitting damage:', { roomId: roomId.current, amount: damage });
          socket.emit('damage', { roomId: roomId.current, amount: damage });
        } else {
          // console.log('Socket not available');
        }

        playHitSound()
        lastHitTime.current = currentTime
        setTimeout(() => setHit(false), 200)
        // console.log('===velocity:', velocity, 'damage:',damage, )
      }
      // console.log('distance:', distance)
    })
  }, [landmarks, decreaseOpponentHealth, playHitSound])

  useFrame(() => {
    if(count_optm.current % 10 === 0) {
      checkHit()
    }
    if (count_optm.current > 1000000) count_optm.current = 0;
    count_optm.current++;
      // console.log('myhead',landmarks?.current?.head?.[0])
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