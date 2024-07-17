import { useGLTF } from '@react-three/drei'

function Model({ position, scale }) {
  const { scene } = useGLTF('/models/bg.glb')
  return <primitive object={scene} position={position} scale={[scale,scale,scale]}/>
}

export function Ring({scale}) {
  return (
      <Model position={[0, -6, 0]} scale={scale}/>
  )
}

useGLTF.preload('/models/bg.glb')