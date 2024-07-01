'use client';

import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Vector3 } from 'three';
import { calculateHandRotation, calculateHeadRotation} from '@/lib/utils/calc_rotation'

const Head = forwardRef(({ position, rotation, scale, name }, ref) => {
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/head.glb')
    const opacity = 0.15
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
  Head.displayName = "Head";
  
  const leftHandModel = '/models/left-hand.glb'
  const rightHandModel = '/models/right-hand.glb'
  
const Hand = forwardRef(({ position, rotation, scale, name }, ref) => {
    const localRef = useRef()
    const { scene } = useGLTF(name === 'leftHand' ? leftHandModel : rightHandModel)
  
    useFrame(() => {
      if (localRef.current && position) {
        if (rotation) {
          localRef.current.rotation.z = -rotation
        }
        localRef.current.position.set((position.x - 0.5) * 5, -(position.y - 0.5) * 5, -position.z * 48)
      }
    })
  
    return <primitive ref={localRef} object={scene} scale={scale} name={name} />
  })
  
function CameraControls({target}){
  const { camera } = useThree()
  const cameraPosition = useRef(new Vector3(0,0,10))
  useFrame(()=> {
    if (target && target.current && target.current.position) {
    const targetPosition = target.current.position.clone()
    targetPosition.z -=4.2
    targetPosition.y +=0.1
  
    // 부드러운 카메라 이동
    cameraPosition.current.lerp(targetPosition,0.1)
    camera.position.copy(cameraPosition.current)
  
    camera.lookAt(target.current.position)
    }
  })
  return null
}

export function Player({ position, landmarks }) {
  const groupRef = useRef(null)
  const headRef = useRef(null)
  // console.log("==>",landmarks.leftHand)

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
  
  const rotations = calculateRotations(landmarks)

  return (
    <>
    <group ref={groupRef} position={position}>
        <Head
          ref={headRef}
          position={landmarks.nose}
          rotation={rotations.head}
          scale={0.25}
          name='head'
        />
         {headRef.current && <CameraControls target={headRef} />}

        {landmarks.rightHand?.wrist && (
          <Hand
            position={landmarks.rightHand.wrist}
            rotation={rotations.rightHand}
            scale={0.33}
            name='rightHand'
          />
        )}
        {landmarks.leftHand?.wrist && (
          <Hand
            position={landmarks.leftHand.wrist}
            rotation={rotations.leftHand}
            scale={0.33}
            name='leftHand'
          />
        )}
      </group>
      </>
  );
}

// 모델 미리 로드
useGLTF.preload('/models/head.glb');