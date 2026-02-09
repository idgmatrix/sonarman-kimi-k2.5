import React, { useEffect, useState } from 'react';
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
  const [showGuide, setShowGuide] = useState(true);
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
      <header className="h-12 bg-sonar-panel border-b border-sonar-grid flex items-center justify-between px-4 panel-elevated">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sonar-accent/20 border border-sonar-accent flex items-center justify-center">
              <span className="text-sonar-accent text-xs">◉</span>
            </div>
            <h1 className="text-lg font-bold text-sonar-accent glow-text tracking-wider">
              SONARMAN
            </h1>
          </div>
          <span className="text-sonar-muted text-xs hidden sm:block">Passive Sonar Simulation</span>
        </div>

        <div className="flex items-center gap-4">
          <ListenerControls />
          <div className="h-6 w-px bg-sonar-grid" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAudioInitialized ? 'bg-sonar-accent' : 'bg-sonar-warning'} animate-pulse`} />
            <span className="text-xs font-mono text-sonar-muted uppercase">
              {isAudioInitialized ? 'Audio Active' : 'Click to Init'}
            </span>
          </div>
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
          {showGuide && (
            <div className="absolute bottom-4 right-4 bg-sonar-panel/90 backdrop-blur px-3 py-2 rounded border border-sonar-grid max-w-[200px] panel-elevated">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-sonar-text">Quick Guide</span>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-sonar-muted hover:text-sonar-text transition-colors"
                >
                  ×
                </button>
              </div>
              <ul className="space-y-1 text-xs text-sonar-muted list-disc list-inside">
                <li>Click targets to select</li>
                <li>Use LOFAR for frequency</li>
                <li>Use DEMON for blade rate</li>
                <li>Use TMA for tracking</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right panel - Analysis displays */}
        <div className="w-1/2 flex flex-col">
          {/* Display tabs */}
          <div className="flex border-b border-sonar-grid">
            {(['LOFAR', 'DEMON', 'TMA'] as const).map(display => (
              <button
                key={display}
                onClick={() => setActiveDisplay(display)}
                className={`flex-1 py-3 text-sm font-mono transition-all ${
                  activeDisplay === display
                    ? 'bg-sonar-grid text-sonar-accent border-b-2 border-sonar-accent shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                    : 'bg-sonar-panel text-sonar-muted hover:text-sonar-text hover:bg-sonar-panel/80'
                }`}
              >
                {display}
              </button>
            ))}
          </div>

          {/* Display content */}
          <div className="flex-1 min-h-[300px] relative sonar-grid scanlines p-4 border border-sonar-grid corner-accent">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sonar-accent/30 pointer-events-none" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sonar-accent/30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sonar-accent/30 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sonar-accent/30 pointer-events-none" />

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
          <div className="flex-1 min-h-[250px] border-t border-sonar-grid flex gap-4 bg-sonar-panel/30">
            <div className="w-1/3 border-r border-sonar-grid p-4 flex flex-col panel-elevated">
              <BearingIndicator />
            </div>
            <div className="w-1/3 border-r border-sonar-grid p-4 flex flex-col panel-elevated">
              <TargetInfo />
            </div>
            <div className="w-1/3 p-4 flex flex-col panel-elevated">
              <ControlPanel audioEngine={audioEngine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};