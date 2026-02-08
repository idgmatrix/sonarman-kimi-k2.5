import React, {  } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
//import * as THREE from 'three';
import { useSonarStore } from '@/store/sonarStore';
import { TargetMesh } from './TargetMesh';

const SceneContent: React.FC = () => {
  const { camera } = useThree();
  const listenerPosition = useSonarStore(state => state.listenerPosition);
  const listenerRotation = useSonarStore(state => state.listenerRotation);
  const targets = useSonarStore(state => state.targets);
  const update = useSonarStore(state => state.update);

  useFrame((_state, delta) => {
    // Update game logic
    update(delta);
    
    // Sync camera with listener
    camera.position.set(
      listenerPosition.x,
      listenerPosition.y + 20,
      listenerPosition.z + 50
    );
    camera.lookAt(
      listenerPosition.x + Math.sin(listenerRotation * Math.PI / 180) * 100,
     

 listenerPosition.y,
      listenerPosition.z + Math.cos(listenerRotation * Math.PI / 180) * 100
    );
  });

  return (
    <>
      {/* Fog for underwater effect */}
      <fog attach="fog" args={['#0a1a2a', 100, 2000]} />
      
      {/* Ambient light */}
      <ambientLight intensity={0.3} color="#1a3a5a" />
      
      {/* Directional light (sun from above) */}
      <directionalLight 
      position={[0, 500, 0]} 
        intensity={0.5} 
        color="#4a8aaa"
      />

      {/* Ocean floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -200, 0]}>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial 
          color="#0a1520" 
          roughness={0.9}
        />
      </mesh>

      {/* Grid for reference */}
      <Grid
        position={[0, -199, 0]}
        args={[5000, 5000]}
        cellSize={100}
        cellThickness={0.5}
        cellColor="#1a3a4a"
        sectionSize={500}
        sectionThickness={1}
        sectionColor="#2a5a7a"
        fadeDistance={2000}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Targets */}
      {targets.map(target => (
        <TargetMesh key={target.id} target={target} />
      ))}

      {/* Listener indicator */}
      <mesh position={[listenerPosition.x, listenerPosition.y, listenerPosition.z]}>
        <coneGeometry args={[5, 10, 8]} />
        <meshStandardMaterial 
          color="#00ff88" 
          emissive="#00ff88"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
        <arrowHelper
          //dir={new THREE.Vector3(
          //  Math.sin(listenerRotation * Math.PI / 180),
          //  0,
          //  Math.cos(listenerRotation * Math.PI / 180)
          //)}
          //length={20}
          //color="#00ff88"
        />
      </mesh>
    </>
  );
};

export const UnderwaterScene: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 20, 50], fov: 60 }}
        gl={{ antialias: true, alpha: true }}


        style={{ background: '#0a1a2a' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
};