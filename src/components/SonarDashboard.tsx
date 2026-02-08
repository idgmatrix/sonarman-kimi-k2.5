import React, { useEffect } from 'react';
import { useSonarStore } from '@/store/sonarStore';
import { WaterfallDisplay } from './WaterfallDisplay';
import { DemonScope } from './DemonScope';
import { TMAPlotter } from './TMAPlotter';
import { BearingIndicator } from './BearingIndicator';
import { TargetInfo } from './TargetInfo';
import { ControlPanel } from './ControlPanel';
import { UnderwaterScene } from '@/three/UnderwaterScene';
import { ListenerControls } from '@/three/ListenerControls';
import { AudioEngine } from '@/audio/AudioEngine';

const audioEngine = new AudioEngine();

export const SonarDashboard: React.FC = () => {
  const isAudioInitialized = useSonarStore(state => state.isAudioInitialized);
  const setAudioInitialized = useSonarStore(state => state.setAudioInitialized);
  const targets = useSonarStore(state => state.targets);
  const listenerPosition = useSonarStore(state => state.listenerPosition);
  const listenerRotation = useSonarStore(state => state.listenerRotation);
  const masterGain = useSonarStore(state => state.masterGain);
  const activeDisplay = useSonarStore(state => state.activeDisplay);
  const setActiveDisplay = useSonarStore(state => state.setActiveDisplay);

  // Initialize audio on first interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!isAudioInitialized) {
        await audioEngine.initialize();
        setAudioInitialized(true);
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    return () => document.removeEventListener('click', initAudio);
  }, [isAudioInitialized, setAudioInitialized]);

  // Update audio engine
  useEffect(() => {
    if (!isAudioInitialized) return;

    audioEngine.setListenerPosition(listenerPosition, listenerRotation);
    audioEngine.setMasterGain(masterGain);

    targets.forEach(target => {
      audioEngine.updateTarget(target);
    });
  }, [isAudioInitialized, targets, listenerPosition, listenerRotation, masterGain]);

  return (
    <div className="w-screen h-screen bg-sonar-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-sonar-panel border-b border-sonar-grid flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-sonar-accent glow-text tracking-wider">
            SONARMAN
          </h1>
          <span className="text-sonar-muted text-sm">Passive Sonar Simulation</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ListenerControls />
          <div className={`w-3 h-3 rounded-full ${isAudioInitialized ? 'bg-sonar-accent' : 'bg-sonar-warning'} animate-pulse`} />
          <span className="text-xs text-sonar-muted">
            {isAudioInitialized ? 'AUDIO ACTIVE' : 'CLICK TO INITIALIZE'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left panel - 3D View */}
        <div className="w-1/2 border-r border-sonar-grid relative">
          <UnderwaterScene />
          <div className="absolute top-4 left-4 bg-sonar-panel/80 backdrop-blur px-3 py-2 rounded border border-sonar-grid">
            <span className="text-xs text-sonar-muted">TACTICAL VIEW</span>
          </div>
        </div>

        {/* Right panel - Analysis displays */}
        <div className="w-1/2 flex flex-col">
          {/* Display tabs */}
          <div className="flex border-b border-sonar-grid">
            {(['LOFAR', 'DEMON', 'TMA'] as const).map(display => (
              <button
                key={display}
                onClick={() => setActiveDisplay(display)}
                className={`flex-1 py-2 text-sm font-mono transition-colors ${
                  activeDisplay === display
                    ? 'bg-sonar-grid text-sonar-accent border-b-2 border-sonar-accent'
                    : 'bg-sonar-panel text-sonar-muted hover:text-sonar-text'
                }`}
              >
                {display}
              </button>
            ))}
          </div>

          {/* Display content */}
          <div className="flex-1 relative sonar-grid scanlines p-4">
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeDisplay === 'LOFAR' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <WaterfallDisplay />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeDisplay === 'DEMON' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <DemonScope />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-300 ${activeDisplay === 'TMA' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <TMAPlotter />
            </div>
          </div>

          {/* Bottom info panel */}
          <div className="h-72 border-t border-sonar-grid flex gap-4">
            <div className="w-1/3 border-r border-sonar-grid p-4 flex flex-col">
              <BearingIndicator />
            </div>
            <div className="w-1/3 border-r border-sonar-grid p-4 flex flex-col">
              <TargetInfo />
            </div>
            <div className="w-1/3 p-4 flex flex-col">
              <ControlPanel audioEngine={audioEngine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};