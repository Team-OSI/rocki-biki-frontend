'use client';

import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { useFrame} from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { calculateHandRotation, calculateHeadRotation} from '@/lib/utils/calc_rotation'
import * as THREE from 'three'

// Opponent 전용 Head 컴포넌트
const OpponentHead = forwardRef(({ position, rotation, scale, name }, ref) => {
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/opponent-head.glb')
    const opacity = 0.9
    useImperativeHandle(
      ref,
      () => ({
        position: localRef.current?.position,
        rotation: localRef.current?.rotation,
      }),
      [localRef], 
    )
     useEffect(() => {
       Object.values(materials).forEach((material) => {
         material.transparent = true
         material.opacity = opacity
       })
     }, [materials, opacity])
  
    useFrame(() => {
      if (localRef.current && position) {
        localRef.current.position.set((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -(position.z+0.01) * 25)
        if (rotation) {
          localRef.current.rotation.z = -rotation
        }
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
          child.material = child.material.clone()
          child.material.color.set('red')
        }
      });
    }, [scene]);

    useFrame(() => {
      if (localRef.current && position) {
        if (rotation) {
          localRef.current.rotation.z = -rotation
        }
        localRef.current.position.set((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -position.z * 48)
      }
    })
  
    return <primitive ref={localRef} object={scene.clone()} scale={scale} name={name} />
  })

OpponentHand.displayName = "OpponentHand";

export function Opponent({ position, opponentData }) {
  const groupRef = useRef(null)
  const headRef = useRef(null)

  const calculateRotations = (data) => {
    if (!data) return {head:0, leftHand:0, rightHand:0}
    return {
      head: data?.leftEye && data?.rightEye
        ? calculateHeadRotation(data.leftEye, data.rightEye)
        : 0,
      leftHand: data?.leftHand?.wrist && data?.leftHand?.indexBase && data?.leftHand?.pinkyBase
        ? calculateHandRotation(data.leftHand.wrist, data.leftHand.indexBase, data.leftHand.pinkyBase)
        : 0,
      rightHand: data?.rightHand?.wrist && data?.rightHand?.indexBase && data?.rightHand?.pinkyBase
        ? calculateHandRotation(data.rightHand.wrist, data.rightHand.indexBase, data.rightHand.pinkyBase)
        : 0
    }
  }
  
  const rotations = calculateRotations(opponentData)

  return (
    <group ref={groupRef} position={position} rotation={[0, Math.PI, 0]}>
        <OpponentHead
          ref={headRef}
          position={opponentData.nose}
          rotation={rotations.head}
          scale={0.25}
          name='opponentHead'
        />
        {opponentData.rightHand?.wrist && (
          <OpponentHand
            position={opponentData.rightHand.wrist}
            rotation={rotations.rightHand}
            scale={0.33}
            name='opponentRightHand'
          />
        )}
        {opponentData.leftHand?.wrist && (
          <OpponentHand
            position={opponentData.leftHand.wrist}
            rotation={rotations.leftHand}
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