import { useGLTF } from '@react-three/drei'

function Model({ position }) {
  const { scene } = useGLTF('/models/bg.glb')
  return <primitive object={scene} position={position}/>
}

export function Ring() {
  return (
      <Model position={[0, -5, 0]}/>
  )
}

useGLTF.preload('/models/bg.glb')