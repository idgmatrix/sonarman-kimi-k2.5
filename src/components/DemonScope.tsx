import React, { useRef, useEffect, useCallback } from 'react';
import { useSonarStore } from '@/store/sonarStore';

const BUFFER_SIZE = 512;

export const DemonScope: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envelopeRef = useRef<number[]>([]);
  const animationRef = useRef<number>();
  
  const targets = useSonarStore(state => state.targets);
  const selectedTargetId = useSonarStore(state => state.selectedTargetId);
  const listenerPosition = useSonarStore(state => state.listenerPosition);
  const setDEMONData = useSonarStore(state => state.setDEMONData);

  const selectedTarget = targets.find(t => t.id === selectedTargetId);

  const generateEnvelope = useCallback((): number[] => {
    if (!selectedTarget || !selectedTarget.detected) {
      return new Array(BUFFER_SIZE).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    }

    const dx = selectedTarget.position.x - listenerPosition.x;
    const dz = selectedTarget.position.z - listenerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const snr = Math.max(0, 40 - distance * 0.05);

    const bladeRate = selectedTarget.signature.shaftRPM / 60 * selectedTarget.signature.bladeCount;
    
    const envelope: number[] = [];
    const now = Date.now() / 1000;
    
    for (let i = 0; i < BUFFER_SIZE; i++) {
      const t = now + i / 44100;
      // Modulated signal: blade rate + harmonics
      let signal = Math.sin(2 * Math.PI * bladeRate * t);
      signal += 0.3 * Math.sin(2 * Math.PI * bladeRate * 2 * t);
      signal += 0.1 * Math.sin(2 * Math.PI * bladeRate * 3 * t);
      
      // Add noise
      signal += (Math.random() - 0.5) * 0.2;
      
      // Scale by SNR
      envelope.push(signal * (snr / 40));
    }

    // Update store with DEMON data
    setDEMONData({
      bladeRate,
      shaftRPM: selectedTarget.signature.shaftRPM,
      confidence: snr / 40,
      envelope
    });

    return envelope;
  }, [selectedTarget, listenerPosition, setDEMONData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const envelope = generateEnvelope();
      envelopeRef.current = envelope;

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
      const scaleX = canvas.width / BUFFER_SIZE;
      const scaleY = canvas.height / 3;

      envelope.forEach((value, i) => {
        const x = i * scaleX;
        const y = centerY - value * scaleY;
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
  }, [generateEnvelope]);

  const demonData = useSonarStore(state => state.demonData);

  return (
    <div className="w-full h-full reletive">
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
            {demonData ? demonData.shaftRPM.toFixed(0) : '--'} RPM
          </div>
        </div>
        <div>
          <div className="text-xs text-sonar-muted mb-1">BLADE COUNT</div>
          <div className="text-xl font-mono text-sonar-accent">
            {selectedTarget ?.signature.bladeCount || '--'}
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