import { create } from 'zustand';
import { 
  SonarState, 
  Target, 
  Vector3, 
  VesselType, 
  ClassificationStatus,
  AcousticSignature,
  BearingReading
} from '@/types';

interface SonarActions {
  // Target management
  addTarget: (target: Target) => void;
  updateTargetPosition: (id: string, position: Vector3, velocity: Vector3) => void;
  selectTarget: (id: string | null) => void;
  classifyTarget: (id: string, classification: ClassificationStatus) => void;
  
  // Audio
  setMasterGain: (gain: number) => void;
  setAudioInitialized: (initialized: boolean) => void;
  
  // Analysis
  addLOFARData: (data: {

 frequencies: number[]; magnitudes: number[] }) => void;
  setDEMONData: (data: { bladeRate: number; shaftRPM: number; confidence: number; envelope: number[] }) => void;
  addBearingReading: (targetId: string, reading: BearingReading) => void;
  
  // Player
  setListenerPosition: (position: Vector3) => void;
  setListenerRotation: (rotation: number) => void;
  
  // UI
  setActiveDisplay: (display: 'LOFAR' | 'DEMON' | 'TMA') => void;
  setTimeCompression: (compression: number) => void;
  
  // Game loop
  update: (deltaTime: number) => void;
}

const createDefaultSignature = (): AcousticSignature => ({
  engineFreq: 60,
  harmonics: [120, 180, 240],
  bladeCount: 4,
  shaftRPM: 120,
  cavitationLevel: 0.3,
  vesselType: VesselType.UNKNOWN,
  vesselClass: 'Unknown'
});

const createDefaultTarget = (id: string, x: number, z: number): Target => ({
  id,
  position: { x, y: -50, z },
  velocity: { x: 2, y: 0, z: 0 },
  course: 90,
  speed: 10,
  depth: 50,
  signature: createDefaultSignature(),
  detected: false,
  classification: ClassificationStatus.UNDETECTED
});

export const useSonarStore = create<SonarState & SonarActions>((set, _get) => ({
  // Initial state
  targets: [
    createDefaultTarget('target-1', 500, 0),
    createDefaultTarget('target-2', -300, 400)
  ],
  selectedTargetId: null,
  masterGain: 0.7,
  isAudioInitialized: false,
  lofarHistory: [],
  demonData: null,
  bearingHistory: new Map(),
  listenerPosition: { x: 0, y: -30, z: 0 },
  listenerRotation: 0,
  activeDisplay: 'LOFAR',
  timeCompression: 1,

  // Actions
  addTarget: (target) => set((state) => ({
    targets: [...state.targets, target]
  })),

  updateTargetPosition: (id, position, velocity) => set((state) => ({
    targets: state.targets.map(t => 
      t.id === id ? { ...t, position, velocity } : t
    )
  })),

  selectTarget: (id) => set({ selectedTargetId: id }),

  classifyTarget: (id, classification) => set((state) => ({
    targets: state.targets.map(t =>
      t.id === id ? { ...t, classification } : t
    )
  })),

  setMasterGain: (gain) => set({ masterGain: gain }),

  setAudioInitialized: (initialized) => set({ isAudioInitialized: initialized }),

  addLOFARData: (data) => set((state) => ({
    lofarHistory: [...state.lofarHistory.slice(-100), { ...data, timestamp: Date.now() }]
  })),

  setDEMONData: (data) => set({ demonData: { ...data } }),

  addBearingReading: (targetId, reading) => set((state) => {
    const history = new Map(state.bearingHistory);
    const readings = history.get(targetId) || [];
    history.set(targetId, [...readings, reading].slice(-200));
    return { bearingHistory: history };
  }),

  setListenerPosition: (position) => set({ listenerPosition: position }),

  setListenerRotation: (rotation) => set({ listenerRotation: rotation }),

  setActiveDisplay: (display) => set({ activeDisplay: display }),

  setTimeCompression: (compression) => set({ timeCompression: compression }),

  update: (deltaTime) => set((state) => {
    const timeScale = state.timeCompression * deltaTime;
    
    const updatedTargets = state.targets.map(target => {
      // Update position based on velocity
      const newPosition = {
        x: target.position.x + target.velocity.x * timeScale,
        y: target.position.y + target.velocity.y * timeScale,
        z: target.position.z + target.velocity.z * timeScale
      };

      // Calculate course from velocity
      const course = Math.atan2(target.velocity.x, target.velocity.z) * (180 / Math.PI);
      const speed = Math.sqrt(
        target.velocity.x ** 2 + 
        target.velocity.z ** 2
      );

      // Calculate bearing from listener
      const dx = newPosition.x - state.listenerPosition.x;
      const dz = newPosition.z - state.listenerPosition.z;
      const bearing = (Math.atan2(dx, dz) * (180 / Math.PI) + 360) % 360;

      // Calculate distance
      const distance = Math.sqrt(dx ** 2 + dz ** 2);

      // Detection logic based on distance and SNR
      const snr = target.signature.cavitationLevel * 1000 / (distance * 0.1 + 1);
      const detected = snr > 5; // Threshold

      // Add bearing reading if detected
      if (detected && Math.random() < 0.3) {
        const reading: BearingReading = {
          timestamp: Date.now(),
          bearing: bearing + (Math.random() - 0.5) * 5, // Add some noise
          confidence: Math.min(snr / 20, 1)
        };
        const history = state.bearingHistory.get(target.id) || [];
        state.bearingHistory.set(target.id, [...history, reading].slice(-200));
      }

      return {
        ...target,
        position: newPosition,
        course,
        speed,
        detected,
        classification: detected && target.classification === ClassificationStatus.UNDETECTED 
          ? ClassificationStatus.DETECTED 
          : target.classification
      };
    });

    return { targets: updatedTargets };
  })
}));