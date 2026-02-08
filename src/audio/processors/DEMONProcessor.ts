import * as Tone from 'tone';

export class DEMONProcessor {
  private analyser: Tone.Analyser;
  private envelopeFollower: Tone.Follower;
  private lowpassFilter: Tone

.Filter;
  private buffer: Float32Array;
  private bufferSize: number;
  private bufferIndex: number;

  constructor(bufferSize: number = 4096) {
    this.bufferSize = bufferSize;
    this.buffer = new Float32Array(bufferSize);
    this.bufferIndex = 0;

    // Envelope follower to extract modulation
    this.envelopeFollower = new Tone.Follower({
      attack: 0.01,
      release: 0.1
    });

    // Lowpass to isolate blade rate (typically 0.5-20 Hz)
    this.lowpassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 50,
      Q: 1
    });

    // Analyser for the envelope
    this.analyser = new Tone.Analyser({
      type: 'waveform',
      size: 1024
    });

    // Chain: envelope -> lowpass -> analyser
    this.envelopeFollower.connect(this.lowpassFilter);
    this.lowpassFilter.connect(this.analyser);
  }

  connect(source: Tone.ToneAudioNode): void {
    source.connect(this.envelopeFollower);
  }

  process(): { envelope: number[]; bladeRate: number; confidence: number } {
    const

 waveform = this.analyser.getValue() as Float32Array;
    
    // Add to buffer
    for (let i = 0; i < waveform.length && this.bufferIndex < this.bufferSize; i++) {
      this.buffer[this.bufferIndex++] = waveform[i];
      if (this.bufferIndex >= this.bufferSize) {
        this.bufferIndex = 0;
      }
    }

    // Simple peak detection for blade rate estimation
    const peaks = this.findPeaks(Array.from(this.buffer));
    const bladeRate = peaks.length > 1 
      ? this.estimateFrequencyFromPeaks(peaks) 
      : 0;

    // Confidence based on signal clarity
    const confidence = this.calculateConfidence(waveform);

    return {
      envelope: Array.from(waveform),
      bladeRate,
      confidence
    };
  }

  private findPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    const threshold = Math.max(...data) * 0.5;
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && 
          data[i] > data[i + 1] && 
          data[i] > threshold) {
        peaks

.push(i);
      }
    }
    
    return peaks;
  }

  private estimateFrequencyFromPeaks(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    let totalDiff = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalDiff += peaks[i] - peaks[i - 1];
    }
    
    const avgSamples = totalDiff / (peaks.length - 1);
    const sampleRate = Tone.context.sampleRate;
    const bufferDuration = this.bufferSize / sampleRate;
    
    return avgSamples > 0 ? 1 / (avgSamples * bufferDuration / this.bufferSize) : 0;
  }

  private calculateConfidence(waveform: Float32Array): number {
    const mean = waveform.reduce((a, b) => a + b, 0) / waveform.length;
    const variance = waveform.reduce((a, b) => a + (b - mean) ** 2, 0) / waveform.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher variance = more modulation = higher confidence
    return Math.min(1, stdDev * 5);
  }

  dispose(): void {
    this.analyser.dispose();
    this.envelopeFollower.dispose();
    this.lowpassFilter.dispose

();
  }
}