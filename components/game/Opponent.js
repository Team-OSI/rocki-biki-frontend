'use client';

import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { useFrame} from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
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
        localRef.current.position.set((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -(position.z+0.01) * 15)
        if (rotation) {
          localRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
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
          localRef.current.rotation.set(rotation[0],rotation[1],rotation[2])
        }
        localRef.current.position.set((position[0]-0.5)*4, -(position[1]-0.5)*4, -position[2]*30)
      }
    })
  
    return <primitive ref={localRef} object={scene.clone()} scale={scale} name={name} />
  })

OpponentHand.displayName = "OpponentHand";

export function Opponent({ position, opponentData }) {
  const groupRef = useRef(null)
  const headRef = useRef(null)

  // const calculateRotations = (data) => {
  //   if (!data) return {head:0, leftHand:0, rightHand:0}
  //   return {
  //     head: data?.leftEye && data?.rightEye
  //       ? calculateHeadRotation(data.leftEye, data.rightEye)
  //       : 0,
  //     leftHand: data?.leftHand?.wrist && data?.leftHand?.indexBase && data?.leftHand?.pinkyBase
  //       ? calculateHandRotation(data.leftHand.wrist, data.leftHand.indexBase, data.leftHand.pinkyBase)
  //       : 0,
  //     rightHand: data?.rightHand?.wrist && data?.rightHand?.indexBase && data?.rightHand?.pinkyBase
  //       ? calculateHandRotation(data.rightHand.wrist, data.rightHand.indexBase, data.rightHand.pinkyBase)
  //       : 0
  //   }
  // }
  
  // const rotations = calculateRotations(opponentData)

  return (
    <group ref={groupRef} position={position} rotation={[0, Math.PI, 0]}>
       {opponentData.head && (
        <OpponentHead
          ref={headRef}
          position={new THREE.Vector3(opponentData.head[0][0], opponentData.head[0][1], opponentData.head[0][2])}
          rotation={[0, -opponentData.head[1][1] * (Math.PI / 180), -opponentData.head[1][2] * (Math.PI / 180)]}
          scale={0.25}
          name='opponentHead'
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