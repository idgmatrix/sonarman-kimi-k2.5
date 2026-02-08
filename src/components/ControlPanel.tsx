import React from 'react';
import { useSonarStore } from '@/store/sonarStore';
import { AudioEngine } from '@/audio/AudioEngine';
import { ClassificationStatus } from '@/types';

interface ControlPanelProps {
  audioEngine: AudioEngine;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ audioEngine }) => {
 

 const masterGain = useSonarStore(state => state.masterGain);
  const setMasterGain = useSonarStore(state => state.setMasterGain);
  const timeCompression = useSonarStore(state => state.timeCompression);
  const setTimeCompression = useSonarStore(state => state.setTimeCompression);
  const isAudioInitialized = useSonarStore(state => state.isAudioInitialized);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs text-sonar-muted mb-2 uppercase tracking-wider">Controls</h3>

      <div className="flex-1 space-y-4">
        {/* Volume control */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-sonar-muted">Volume</span>
            <span className="font-mono text-sonar-text">{(masterGain * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterGain}
            onChange={(e) => {
              const gain = parseFloat(e.target.value);
              setMasterGain(gain);
              audioEngine.setMasterGain(gain);
            }}
            className="w-full h-2 bg-sonar-grid rounded-lg appearance-none cursor-pointer accent-sonar-accent"
          />
        </div>

        {/* Time compression */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-sonar-muted">Time Compression</span>
            <span className="font-mono text-sonar-text">{timeCompression}x</span>
          </div>
          <div className="flex gap-1">
            {[1, 5, 10, 20].map(rate => (
              <button
                key={rate}
                onClick={() => setTimeCompression(rate)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  timeCompression === rate
                    ? 'bg-sonar-accent text-sonar-bg border-sonar-accent'
                    : 'bg-sonar-panel text-sonar-text border-sonar-grid hover:border-sonar-accent'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio status */}
        <div className="bg-sonar-panel/90 backdrop-blur rounded p-2 border border-sonar-grid">
          <div className="text-xs text-sonar-muted mb-1">AUDIO STATUS</div>
          <div className={`text-xs font-mono ${isAudioInitialized ? 'text-sonar-accent' : 'text-sonar-warning'}`}>
            {isAudioInitialized ? '● ACTIVE' : '○ INACTIVE - Click to start'}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-1">
          <button
            onClick={() => {
              if (!isAudioInitialized) {
                audioEngine.initialize();
              }
            }}
            className="w-full py-2 bg-sonar-accent/10 border border-sonar-accent text-sonar-accent text-xs rounded hover:bg-sonar-accent/20 transition-colors"
          >
            {isAudioInitialized ? 'Audio Running' : 'Initialize Audio'}
          </button>

          <button
            onClick={() => {
              // Reset all classifications
              const targets = useSonarStore.getState().targets;
              targets.forEach(t => {
                useSonarStore.getState().classifyTarget(t.id, t.detected ? ClassificationStatus.DETECTED : ClassificationStatus.UNDETECTED);
              });
            }}
            className="w-full py-2 bg-sonar-panel border border-sonar-grid text-sonar-text text-xs rounded hover:bg-sonar-grid transition-colors"
          >
            Reset Classifications
          </button>
        </div>
      </div>
    </div>
  );
};