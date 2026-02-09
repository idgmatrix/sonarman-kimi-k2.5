import React, { useRef, useEffect } from 'react';
import { useSonarStore } from '@/store/sonarStore';
import { AudioEngine } from '@/audio/AudioEngine';

interface DemonScopeProps {
  audioEngine: AudioEngine;
}

export const DemonScope: React.FC<DemonScopeProps> = ({ audioEngine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  const selectedTargetId = useSonarStore(state => state.selectedTargetId);
  const isAudioInitialized = useSonarStore(state => state.isAudioInitialized);
  const setDEMONData = useSonarStore(state => state.setDEMONData);
  const demonData = useSonarStore(state => state.demonData);
  const targets = useSonarStore(state => state.targets);

  const selectedTarget = targets.find(t => t.id === selectedTargetId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      let envelope: number[] = [];
      let bladeRate = 0;
      let confidence = 0;
      let shaftRPM = 0;

      // Get real data from audio engine
      if (selectedTargetId && isAudioInitialized && selectedTarget) {
        const data = audioEngine.getDEMONData(selectedTargetId);
        if (data) {
          envelope = data.envelope;
          bladeRate = data.bladeRate;
          confidence = data.confidence;
          shaftRPM = selectedTarget.signature.shaftRPM; // Current truth (in reality derived from blade rate)

          // Throttle store updates to 5Hz to avoid excessive re-renders
          const now = Date.now();
          if (now - lastUpdateRef.current > 200) {
            setDEMONData({
              bladeRate,
              shaftRPM,
              confidence,
              envelope // Note: Storing heavy array in store might be slow if large
            });
            lastUpdateRef.current = now;
          }
        }
      }

      // If no data (undetected or no selection), show noise
      if (envelope.length === 0) {
        // Fallback noise
        envelope = new Array(512).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      }

      // Clear
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
      }
      ctx.stroke();

      // Draw waveform
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      // Adjust scale based on buffer size from processor (1024)
      const bufferSize = envelope.length || 512;
      const scaleX = canvas.width / bufferSize;
      const scaleY = canvas.height / 2; // Adjust gain for visibility

      envelope.forEach((value, i) => {
        const x = i * scaleX;
        // value is typically small, so we scale it up
        const y = centerY - value * scaleY * 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();

      // Draw center line
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedTargetId, isAudioInitialized, audioEngine, setDEMONData, selectedTarget]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={245}
        className="w-full h-full"
      />

      {/* Info panel */}
      <div className="absolute bottom-0 bg-sonar-panel/90 backdrop-blur border-t border-sonar-grid p-3 flex gap-8">
        <div>
          <div className="text-xs text-sonar-muted mb-1">BLADE RATE</div>
          <div className="text-xl font-mono text-sonar-accent">
            {demonData ? demonData.bladeRate.toFixed(2) : '--'} Hz
          </div>
        </div>
        <div>
          <div className="text-xs text-sonar-muted mb-1">SHAFT RPM</div>
          <div className="text-xl font-mono text-sonar-accent">
            {selectedTarget ? selectedTarget.signature.shaftRPM.toFixed(0) : '--'} RPM
          </div>
        </div>
        <div>
          <div className="text-xs text-sonar-muted mb-1">BLADE COUNT</div>
          <div className="text-xl font-mono text-sonar-accent">
            {selectedTarget?.signature.bladeCount || '--'}
          </div>
        </div>
        <div>
          <div className="text-xs text-sonar-muted mb-1">CONFIDENCE</div>
          <div className="text-xl font-mono text-sonar-accent">
            {demonData ? (demonData.confidence * 100).toFixed(0) : '--'}%
          </div>
        </div>
      </div>

      <div className="absolute top-2 left-2 text-xs text-sonar-muted bg-sonar-panel/80 backdrop-blur px-2 py-1 rounded border border-sonar-grid">
        DEMON - Demodulated Noise
      </div>
    </div>
  );
};