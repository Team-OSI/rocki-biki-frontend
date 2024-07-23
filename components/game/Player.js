'use client';

import { forwardRef, useRef,useState, useEffect, useImperativeHandle, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture, Trail } from '@react-three/drei'
import * as THREE from 'three';
import useGaugeStore from '@/store/gaugeStore';
import useGameStore from '@/store/gameStore';

// player 머리 불러오기
const Head = forwardRef(({ position, rotation, scale, name }, ref) => {
    const localRef = useRef()
    const { scene, materials } = useGLTF('/models/head.glb')
    const opacity = 0.19
    const playerHealth = useGameStore(state => state.playerHealth);
    const [hit, setHit] = useState(false)
    const prevHealthRef = useRef(playerHealth)

    //shield
    const playerSkills = useGameStore(state => state.playerSkills);
    const shieldActive = playerSkills[0] === 'Shield';
    const shieldPer = playerSkills[1];

    const adjustedScale = shieldActive && shieldPer !== null 
    ? scale * (1 - (shieldPer || 0) * 0.6) 
    : scale;

    // 텍스처 로드
    const textures = useTexture({
      default: 'images/textures/face_default.png',
      hit: 'images/textures/face_hit.png',
      hpUnder60: 'images/textures/face_HpUnder_60.png',
      hpUnder30: 'images/textures/face_HpUnder_30.png',
    })
    // 현재 텍스처 계산
    const currentTexture = useMemo(() => {
      if (hit) return textures.hit;
      if (playerHealth <= 30) return textures.hpUnder30;
      if (playerHealth <= 60) return textures.hpUnder60;
      return textures.default;
    }, [hit, playerHealth, textures]);

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
      if (playerHealth < prevHealthRef.current) {
        setHit(true)
        setTimeout(() => setHit(false), 500) // 0.5초 후 hit 상태 해제
      }
      prevHealthRef.current = playerHealth
    }, [playerHealth])

    
    useEffect(() => {
      Object.values(materials).forEach((material) => {
        material.transparent = true
        material.opacity = opacity
        material.depthWrite = false;
        material.roughness = 0.5;
        material.color.setRGB(hit ? 1 : 1, hit ? 0 : 1, hit ? 0 : 1) // Set color to red when hit
        material.map = currentTexture
        material.needsUpdate = true
      })
    }, [materials, hit, currentTexture])
  
     useEffect(() => {
      if (localRef.current && position) {
        localRef.current.position.set((position.x - 0.5) * 5, - (position.y - 0.5) * 5, - (position.z+0.01) * 15)
        if (rotation) {
          localRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
      }
    },[position, rotation])
    return <primitive ref={localRef} object={scene} scale={adjustedScale} name={name} />
  })
  Head.displayName = "Head";
  // export { Hand };
  
  const leftHandModel = '/models/left-hand.glb';
  const rightHandModel = '/models/right-hand.glb';

// player 손 불러오기
const Hand = forwardRef(({ position, rotation, scale, name, color = 'red', isAttacking }, ref) => {
    const localRef = useRef();
    const { scene: originalScene } = useGLTF(name === 'leftHand' ? leftHandModel : rightHandModel);
    const colorChangedRef = useRef(false);
    const trailRef = useRef();

     // 트레일 텍스처 로드
     const trailTexture = useTexture('/images/logo/kakao.png')
    // scene을 복제하고 메모이제이션
    const scene = useMemo(() => originalScene.clone(), [originalScene])

    // 색상 변경 함수를 메모이제이션
    const changeColor = useCallback(() => {
      if (colorChangedRef.current) return; // 이미 색상이 변경되었다면 중단

      scene.traverse((child) => {
          if (child.isMesh) {
              if (child.material.color) {
                  child.material = child.material.clone(); // 재질 복제
                  child.material.color.set(color);
                  child.material.transparent = true;
                  child.material.needsUpdate = true;
              }
          }
      });

      colorChangedRef.current = true; // 색상 변경 완료 표시
  }, [scene, color]);

  // 색상 변경 효과
  useEffect(() => {
    changeColor();
  }, [changeColor]);

  useEffect(() => {
      if (localRef.current && position) {
        if (rotation) {
          // localRef.current.rotation.set((rotation[0]-Math.PI/6)*0.5, 0, -(rotation[2]-Math.PI/2));
          localRef.current.rotation.set(rotation[0],rotation[1],rotation[2])
        }
        localRef.current.position.set((position[0]-0.5)*4, -(position[1]-0.5)*4, -position[2]*30)
      }
    },[position, rotation])
  
    return (
      <group ref={localRef}>
          <primitive object={scene} scale={scale} name={name} />
          {isAttacking && (
              <>
                  <primitive object={new THREE.PointLight(color, 100, 50)} />
                  <Trail
                      width={7}
                      length={4}
                      color={color}
                      attenuation={(t) => t * t}
                      texture={trailTexture}
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
  Hand.displayName = "Hand";
  
function CameraControls({target}){
  const { camera } = useThree()
  const cameraPosition = useRef(new THREE.Vector3(0,0,-10))
  useFrame(()=> {
    if (target && target.current && target.current.position) {
    const targetPosition = target.current.position.clone()
    targetPosition.z -= 6.8
    targetPosition.y +=0.25
    
    // 부드러운 카메라 이동
    cameraPosition.current.lerp(targetPosition,0.01)
    camera.position.copy(cameraPosition.current)
  
    camera.lookAt(target.current.position)

    camera.near = 0.1;
    camera.raf = 1000;
    }
  })
  return null
}

export function Player({ position, landmarks }) {

  const groupRef = useRef(null)
  const headRef = useRef(null)
  // 공격
  const playerSkills = useGameStore(state => state.playerSkills)
  const isAttacking = playerSkills[0] === 'Attack' && opponentSkills[1] !== null;

  // 게이지 구현
  const { 
    updateGauge, 
    headChargeDistance 
  } = useGaugeStore();
  useFrame(() => {
      updateGauges();
    }
  )
  const updateGauges = useCallback(() => {
    if(!headRef.current || !landmarks.leftHand || !landmarks.rightHand) return

    const headPosition = new THREE.Vector3()
    headRef.current.getWorldPosition(headPosition)

    ;['left', 'right'].forEach(hand => {
      const handPos = new THREE.Vector3(
        (landmarks[`${hand}Hand`][0][0] - 0.5) * 4,
        -(landmarks[`${hand}Hand`][0][1] - 0.5) * 4,
        -landmarks[`${hand}Hand`][0][2] * 30
      );
      
      const distanceToHead = handPos.distanceTo(headPosition);
      const isCharging = distanceToHead < headChargeDistance;
      
      updateGauge(hand, isCharging);
    });
  }, [landmarks, updateGauge, headChargeDistance])

  return (
    <>
    <group ref={groupRef} position={position} >
        {landmarks?.head && (
        <Head
          ref={headRef}
          position={new THREE.Vector3(landmarks.head[0][0], landmarks.head[0][1], landmarks.head[0][2])}
          rotation={[0, -landmarks.head[1][1] * (Math.PI / 180), -landmarks.head[1][2] * (Math.PI / 180)]}
          scale={0.25}
          name='head'
        />
        )}
        {headRef.current && <CameraControls target={headRef} />}

        {landmarks?.rightHand && (
          <Hand
            position={landmarks.rightHand[0]}
            rotation={[(landmarks.rightHand[1][0]-Math.PI), Math.PI , -(landmarks.rightHand[1][1]-Math.PI/2)]}
            scale={0.33}
            name='rightHand'
            color = 'red'
            isAttacking={isAttacking}
          />
        )}
        {landmarks?.leftHand && (
          <Hand
            position={landmarks.leftHand[0]}
            rotation={[-(landmarks.leftHand[1][0]-Math.PI), 0 ,-(landmarks.leftHand[1][1]+Math.PI/2)]}
            scale={0.33}
            name='leftHand'
            color = 'red'
            isAttacking={isAttacking}
          />
        )}
      </group>
      </>
  );
}

// 모델 미리 로드
useGLTF.preload('/models/head.glb');
useGLTF.preload('/models/left-hand.glb');
useGLTF.preload('/models/right-hand.glb');