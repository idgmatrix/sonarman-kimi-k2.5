import * as Tone from 'tone';
import { Vector3, Target } from '@/types';

export class AudioEngine {
  private listener: typeof Tone.Listener;
  private masterGain: Tone.Gain;
  private targetSources: Map<string, Tone.Panner3D>;
  private targetNoises: Map<string, Tone.Noise>;
  private targetFilters: Map<string, Tone.Filter>;
  private isInitialized: boolean = false;

  constructor() {
    this.listener = Tone.Listener;
    this.masterGain = new Tone.Gain(0.7).toDestination();
    this.targetSources = new Map();
    this.targetNoises = new Map();
    this.targetFilters = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await Tone.start();
    
    // Set up listener at origin
    this.listener.positionX.value = 0;
    this.listener.positionY.value = 0;
    this.listener.positionZ.value = 0;
    
    this.isInitialized = true;
  }

  setListenerPosition(position: Vector3, rotation: number): void {
    if (!this.isInitialized) return;

    this.listener.positionX.value = position.x;
    this.listener.positionY.value = position.y;
    this.listener.positionZ.value = position.z;
    
    // Set listener orientation (forward vector)
    const forwardX = Math.sin(rotation * Math.PI / 180);
    const forwardZ = Math.cos(rotation * Math.PI / 180);
    this.listener.forwardX.value = forwardX;
    this.listener.forwardZ.value = forwardZ;
  }

  addTarget(target: Target): void {
    if (!this.isInitialized) return;
    if (this.targetSources.has(target.id)) return;

    // Create 3D panner for spatial audio
    const panner = new Tone.Panner3D({
      positionX: target.position.x,
      positionY: target.position.y,
      positionZ: target.position.z,
      refDistance: 100,
      maxDistance: 10000,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0
    });

    // Create noise source for cavitation
    const noise = new Tone.Noise({
      type: 'brown',
      playbackRate: 1
    });

    // Create filter to simulate underwater propagation
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 1000,
      Q: 1
    });

    // Create gain for this target
    const targetGain = new Tone.Gain(target.signature.cavitationLevel * 0.5);

    // Connect chain
    noise.connect(filter);
    filter.connect(targetGain);
    targetGain.connect(panner);
    panner.connect(this.masterGain);

    // Start noise
    noise.start();

    // Store references
    this.targetSources.set(target.id, panner);
    this.targetNoises.set(target.id, noise);
    this.targetFilters.set(target.id, filter);
  }

  removeTarget(targetId: string): void {
    const panner = this.targetSources.get(targetId);
    const noise = this.targetNoises.get(targetId);
    const filter = this.targetFilters.get(targetId);

    if (noise) {
      noise.stop();
      noise.dispose();
    }
    if (filter) filter.dispose();
    if (panner) panner.dispose();

    this.targetSources.delete(targetId);
    this.targetNoises.delete(targetId);
    this.targetFilters.delete(targetId);
  }

  updateTarget(target: Target): void {
    if (!this.isInitialized) return;

    const panner = this.targetSources.get(target.id);
    if (!panner) {
      this.addTarget(target);
      return;
    }

    // Update position
    panner.positionX.value = target.position.x;
    panner.positionY.value = target.position.y;
    panner.positionZ.value = target.position.z;

    // Calculate Doppler shift based on relative velocity
    const dx = target.position.x; // relative to listener at 0
    const dz = target.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 0) {
      const relativeVelocity = (
        target.velocity.x * (dx / distance) + 
        target.velocity.z * (dz / distance)
      );
      
      // Doppler effect: shift playback rate
      const speedOfSound = 1500; // m/s in water
      const dopplerShift = speedOfSound / (speedOfSound - relativeVelocity);
      
      const noise = this.targetNoises.get(target.id);
      if (noise) {
        noise.playbackRate = Math.max(0.5, Math.min(2, dopplerShift));
      }
    }

    // Update filter based on depth (deeper = more low-pass)
    const filter = this

.targetFilters.get(target.id);
    if (filter) {
      const depthAttenuation = Math.max(200, 2000 - target.depth * 10);
      filter.frequency.value = depthAttenuation;
    }
  }

  setMasterGain(gain: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, gain));
  }

  getAnalyserData(): Float32Array | null {
    // This would return FFT data for LOFAR display
    // For now, return null - we'll implement with Tone.Analyser
    return null;
  }

  dispose(): void {
    this.targetSources.forEach((panner, id) => {
      this.removeTarget(id);
    });
    this.masterGain.dispose();
  }
}