import React, { useRef, useEffect, useCallback } from 'react';
import { useSonarStore } from '@/store/sonarStore';

const FFT_SIZE = 512;
const HISTORY_SIZE = 200;



export const WaterfallDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[][]>([]);
  const animationRef = useRef<number>();
  
  const targets = useSonarStore(state => state.targets);
  const listenerPosition = useSonarStore(state => state.listenerPosition);

  // Generate simulated FFT data
  const generateFFTData = useCallback((): number[] => {
    const data = new Array(FFT_SIZE / 2).fill(0);
    
    // Background noise
    for (let i = 0; i < data.length; i++) {
      data[i] = -80 + Math.random() * 10; // Base noise floor in dB
    }

    // Add target signals
    targets.forEach(target => {
      if (!target.detected) return;

      const dx = target.position.x - listenerPosition.x;
      const dz = target.position.z - listenerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Signal strength based on distance
      const snr = Math.max(0, 40 - distance * 0.05);
      
      if (snr > 5) {
        // Fundamental frequency
        const fundBin = Math.floor(target.signature.engineFreq * FFT_SIZE / 2000);
        if (fundBin < data.length) {
          data[fundBin] = Math.max(data[fundBin], -40 + snr);
          // Spread
          data[fundBin - 1] = Math.max(data[fundBin - 1], -45 + snr * 0.8);
          data[fundBin + 1] = Math.max(data[fundBin + 1], -45 + snr * 0.8);
        }

        // Harmonics
        target.signature.harmonics.forEach((harmonic, idx) => {
          const harmBin = Math.floor(harmonic * FFT_SIZE / 2000);
          if (harmBin < data.length) {
            data[harmBin] = Math.max(data[harmBin], -50 + snr * 0.7 / (idx + 1));
          }
        });
      }
    });

    return data;
  }, [targets, listenerPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Generate new data line
      const newLine = generateFFTData();
      historyRef.current.push(newLine);
      if (historyRef.current.length > HISTORY_SIZE) {
        historyRef.current.shift();
      }

      // Clear canvas
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waterfall
      const lineHeight = canvas.height / HISTORY_SIZE;
      const binWidth = canvas.width / (FFT_SIZE / 2);

      historyRef.current.forEach((line, row) => {
        const y = canvas.height - (row + 1) * lineHeight;
        
        line.forEach((value, bin) => {
          const intensity = Math.max(0, (value + 80) / 60); // Normalize to 0-1
          
          // Color mapping (black -> blue -> green -> yellow -> red)
          let r = 0, g = 0, b = 0;
          if (intensity < 0.25) {
            b = Math.floor(intensity * 4 * 255);
          } else if (intensity < 0.5) {
            g = Math.floor((intensity - 0.25) * 4 * 255);
            b = 255;
          } else if (intensity < 0.75) {
            r = Math.floor((intensity - 0.5) * 4 * 255);
            g

 = 255;
          } else {
            r = 255;
            g = Math.floor((1 - (intensity - 0.75) * 4) * 255);
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(bin * binWidth, y, binWidth + 1, lineHeight + 1);
        });
      });

      // Draw frequency labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      [0, 250, 500, 750, 1000].forEach(freq => {
        const x = (freq / 1000) * canvas.width;
        ctx.fillText(`${freq}Hz`, x, canvas.height - 5);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [generateFFTData]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2 text

-xs text-sonar-muted bg-sonar-panel/80 px-2 py-1 rounded">
        LOFAR - Low Frequency Analysis
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-xs text-sonar-muted">
        <span>-20dB</span>
        <span>-40dB</span>
        <span>-60dB</span>
        <span>-80dB</span>
      </div>
    </div>
  );
};