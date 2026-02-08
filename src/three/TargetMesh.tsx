import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Target, ClassificationStatus } from '@/types';
import { useSonarStore } from '@/store/sonarStore';

interface TargetMeshProps {
  target: Target;
}

export const TargetMesh: React.FC<TargetMeshProps> = ({ target }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedTargetId = useSonarStore(state => state.selectedTargetId);
  const selectTarget = useSonarStore(state => state.selectTarget);

  const isSelected = selectedTargetId === target.id;
  
  // Color based on classification status
  const getColor = () => {
    switch (target.classification) {
      case ClassificationStatus.IDENTIFIED:
        return '#00ff88';
      case ClassificationStatus.ANALYZING:
        return '#ffaa00';
      case ClassificationStatus.DETECTED:
        return '#ff6b35';
      default:
        return '#3a4a5a';
    }
  };

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        target.position.x,
        target.position.y,
        target.position.z
      );
      meshRef.current.rotation.y = (target.course * Math.PI) / 180;
    }
  });

  return (
    <group>
      {/* Target mesh */}
      <mesh
        ref={meshRef}
        onClick={() => selectTarget(target.id)}
      >
        <boxGeometry args={[8, 4, 20]} />
        <meshStandardMaterial
          color={getColor()}
          emissive={isSelected ? getColor() : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          transparent
          opacity={target.detected ? 0.9 : 0.3}
        />
      </mesh>

      {/* Detection ring (visible when detected) */}
      {target.detected && (
        <mesh position={[target.position.x, target.position.y, target.position.z]}>
          <ringGeometry args={[25, 27, 32]} />
          <meshBasicMaterial 
            color={getColor()} 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Bearing line to listener */}
      {target.detected && isSelected && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                target.position.x, target.position.y, target.position.z,
                0, -30, 0 // listener position
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={getColor()} opacity={0.3} transparent />
        </line>
      )}
    </group>
  );
};