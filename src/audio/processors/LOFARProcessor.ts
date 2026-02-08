import * as Tone from 'tone';

export class LOFARProcessor {
  private analyser: Tone.Analyser;
  private fftSize: number;
  private sampleRate: number;

  constructor(fftSize: number = 2048) {
    this.fftSize = fftSize;
    this.sampleRate = Tone.context.sampleRate;
    
    this.analyser = new Tone.Analyser({
      type: 'fft',
      size: fftSize,
      smoothing: 0.8
    });
  }

  connect(source: Tone.ToneAudioNode): void {
    source.connect(this.analyser);
  }

  getFrequencyData(): { frequencies: number[]; magnitudes: number[] } {
    const values = this.analyser.getValue() as Float32Array;
    const frequencies: number[] = [];
    const magnitudes: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const freq = (i * this.sampleRate) / (2 * values.length);
      if (freq <= 1000) { // Only up to 1kHz for sonar
        frequencies.push(freq);
        magnitudes.push(values[i]);
      }
    }

    return { frequencies, magnitudes };
  }

  getWaterfallLine(): number[] {
    const values = this.analyser.getValue() as Float32Array;
    return Array.from(values).slice(0, values.length / 4); // Low frequencies only
  }

  dispose(): void {
    this.analyser.dispose();
  }
}