export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Target {
  id: string;
  position: Vector3;
  velocity: Vector3;
  course: number; // degrees
  speed: number; // knots
  depth: number;
  signature: AcousticSignature;
  detected: boolean;
  classification: ClassificationStatus;
}

export interface AcousticSignature {
  engineFreq: number; // Hz - fundamental engine frequency
  harmonics: number[]; // harmonic frequencies
  bladeCount: number;
 

 shaftRPM: number;
  cavitationLevel: number; // 0-1
  vesselType: VesselType;
  vesselClass: string;
}

export enum VesselType {
  SURFACE = 'SURFACE',
  SUBMARINE = 'SUBMARINE',
  MERCHANT = 'MERCHANT',
  WARSHIP = 'WARSHIP',
  UNKNOWN = 'UNKNOWN'
}

export enum ClassificationStatus {
  UNDETECTED = 'UNDETECTED',
  DETECTED = 'DETECTED',
  ANALYZING = 'ANALYZING',
  IDENTIFIED = 'IDENTIFIED'
}

export interface BearingReading {
  timestamp: number;
  bearing: number; // degrees
  confidence: number; // 0-1
}

export interface LOFARData {
  frequencies: number[];
  magnitudes: number[];
  timestamp: number;
}

export interface DEMONData {
  bladeRate: number; // Hz
  shaftRPM: number;
  confidence: number;
  envelope: number[];
}

export interface SonarState {
  // Targets
  targets: Target[];
  selectedTargetId: string | null;
  
  // Audio
  masterGain: number;
  isAudioInitialized: boolean;
  
  // Analysis
  lofarHistory: LOFARData[];
  demonData: DEMONData | null;
  bearingHistory: Map<string, BearingReading[]>;
  
  // Player/Listener
  listenerPosition: Vector3;
  listenerRotation: number;
  
  // UI
  activeDisplay: 'LOFAR' | 'DEMON' | 'TMA';
  timeCompression: number; // 1x, 10x, etc.
}

export interface VesselDatabaseEntry {
  type: VesselType;
  class: string;
  description: string;
  signature: AcousticSignature;
  image?: string;
}