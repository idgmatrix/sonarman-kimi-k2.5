import React from 'react';
import { useSonarStore } from '@/store/sonarStore';

export const ListenerControls: React.FC = () => {
  const listenerRotation = useSonarStore(state => state.listenerRotation);
  const

 setListenerRotation = useSonarStore(state => state.setListenerRotation);

  const rotateLeft = () => {
    setListenerRotation((listenerRotation - 15 + 360) % 360);
  };

  const rotateRight = () => {
    setListenerRotation((listenerRotation + 15) % 360);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={rotateLeft}
        className="px-3 py-1 bg-sonar-panel hover:bg-sonar-grid border border-sonar-grid rounded text-sonar-accent transition-colors"
      >
        ← 15°
      </button>
      <div className="px-4 py-1 bg-sonar-bg border border-sonar-grid rounded font-mono text-sonar-accent min-w-[80px] text-center">
        {listenerRotation.toFixed(0)}°
      </div>
      <button
        onClick={rotateRight}
        className="px-3 py-1 bg-sonar-panel hover:bg-sonar-grid border border-sonar-grid rounded text-sonar-accent transition-colors"
      >
        15° →
      </button>
    </div>
  );
};