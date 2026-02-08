import * as Tone from 'tone';

const HARMONIC_GAIN_BASE = 0.3;
const FUNDAMENTAL_GAIN = 0.5;
const NOISE_FILTER_FREQ = 800;

export interface SignalParams {
  frequency: number;
  harmonics: number[];
  modulationFreq: number; // Blade rate
  noiseLevel: number;
  amplitude: number;
}

export class SignalGenerator {
  private oscillator: Tone.Oscillator | null = null;
  private harmonics: Tone.Oscillator[] = [];
  private modulator: Tone.Oscillator | null = null;
  private noise: Tone.Noise | null = null;
  private envelope: Tone.AmplitudeEnvelope | null = null;
  private gain: Tone.Gain | null = null;

  constructor() {}

  createEngineSignal(params: SignalParams): Tone.Gain {
    // Main output gain
    this.gain = new Tone.Gain(params.amplitude);

    // Fundamental frequency (engine)
    this.oscillator = new Tone.Oscillator({
      type: 'sawtooth',
      frequency: params.frequency
    });

    // Harmonics
    params.harmonics.forEach((harmonic, index) => {
      const osc = new Tone.Oscillator({
        type: 'sine',
        frequency: harmonic
      });
      const harmonicGain = new Tone.Gain(HARMONIC_GAIN_BASE / (index + 1));
      osc.connect(harmonicGain);
      if (this.gain) {
        harmonicGain.connect(this.gain);
      }
      osc.start();
      this.harmonics.push(osc);
    });

    // Modulator for blade rate (DEMON analysis)
    this.modulator = new Tone.Oscillator({
      type: 'sine',
      frequency: params.modulationFreq
    });

    // Envelope follower for modulation
    this.envelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.1,
      sustain: 0.5,
      release: 0.1
    });

    // Cavitation noise
    this.noise = new Tone.Noise({
      type: 'brown',
      playbackRate: 1
    });
    const noiseFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: NOISE_FILTER_FREQ
    });
    const noiseGain = new Tone.Gain(params.noiseLevel);

    this.noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.gain);

    // Connect modulation
    this.modulator.connect(this.envelope);
    this.envelope.connect(this.gain.gain);

    // Start sources
    this.oscillator.start();
    this.modulator.start();
    this.noise.start();

    // Connect fundamental through envelope
    const fundamentalGain = new Tone.Gain(FUNDAMENTAL_GAIN);
    this.oscillator.connect(fundamentalGain);
    fundamentalGain.connect(this.gain);

    return this.gain;
  }

  updateParams(params: Partial<SignalParams>): void {
    if (params.frequency !== undefined && this.oscillator) {
      this.oscillator.frequency.value = params.frequency;
    }
    if (params.modulationFreq !== undefined && this.modulator) {
      this.modulator.frequency.value = params.modulationFreq;
    }
    if (params.amplitude !== undefined && this.gain) {
      this.gain.gain.value = params.amplitude;
    }
  }

  dispose(): void {
    this.oscillator?.dispose();
    this.harmonics.forEach(h => h.dispose());
    this.modulator?.dispose();
    this.noise?.dispose();
    this.envelope?.dispose();
    this.gain?.dispose();
  }
}