# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sonarman** is a passive sonar simulation built with React, TypeScript, Three.js, and Tone.js. It visualizes and simulates underwater acoustic detection using 3D scenes, audio visualization, and signal processing.

## Development Commands

```bash
# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

**Note**: Audio requires user interaction to initialize. The `AudioEngine.initialize()` is triggered on first user interaction (click) in the UI.

## Architecture

### Core Modules

**State Management** (`src/store/sonarStore.ts`)
- Centralized Zustand store managing:
  - Target entities with positions, velocities, classifications
  - Audio state (initialized status, master gain)
  - Analysis history (LOFAR, DEMON, bearing readings)
  - Player/Listener state (position, rotation)
  - UI state (active display, time compression)
- Game loop runs in `update()` method, updating target positions and calculating detections
- `update()` handles physics: velocity-based movement, bearing calculations, SNR-based detection
  - Detection logic: SNR = cavitationLevel * 1000 / (distance * 0.1 + 1)
  - Target detected when SNR > 5 threshold
  - Bearing readings added with 30% probability when detected (with noise)

**Audio Engine** (`src/audio/AudioEngine.ts`)
- Tone.js-based spatial audio system
- Creates 3D panner nodes for each target with:
  - Position-based audio
  - Doppler effect based on relative velocity
  - Depth-based filtering (deeper = more low-pass)
- Must be accessed via singleton instance created in `SonarDashboard.tsx`
- Calls to `setListenerPosition()` update Tone.js listener
- Uses noise sources and filters to simulate cavitation underwater propagation
- Audio signal chain per target: Noise -> Filter -> Gain -> Panner3D -> MasterGain -> Destination
- Doppler effect calculated based on relative velocity to listener
- Depth affects lowpass filter frequency (deeper = more attenuation)

**3D Scene** (`src/three/UnderwaterScene.tsx`)
- React Three Fiber canvas with camera following listener
- Game loop runs via `useFrame` hook calling `store.update(delta)` every frame
- Coordinate system: Y is up/down (negative Y = deeper), X/Z are horizontal plane
- Fog for underwater depth effect
- Grid overlay with 100-unit cells
- Ocean floor at y=-200
- Targets rendered as 3D meshes
- Listener indicator (cone) shows current position and rotation

### Signal Processing

**Processors** (`src/audio/processors/`)
- `LOFARProcessor.ts`: Low Frequency Analysis and Recording processing
  - Uses Tone.Analyser with FFT size 2048
  - Returns frequencies up to 1kHz for sonar display
  - Connects to audio sources to get real-time spectral data
- `DEMONProcessor.ts`: Demodulation analysis for blade rate extraction
  - Uses envelope follower to extract modulation from cavitation noise
  - Lowpass filter isolates blade rate (0.5-20 Hz typical range)
  - Calculates confidence based on signal variance

**FFT.js**: Used for spectral analysis of acoustic signals

### Component Structure

**Dashboard** (`src/components/SonarDashboard.tsx`)
- Main container, initializes audio on first interaction
- Left panel: 3D UnderwaterScene with tactical view
- Right panel: Analysis displays (LOFAR/DEMON/TMA tabs)
- Bottom panel: Bearing indicator, Target info, Control panel

**Displays**:
- `WaterfallDisplay.tsx`: Frequency vs time waterfall plot
- `DemonScope.tsx`: Envelope vs frequency DEMON analysis
- `TMAPlotter.tsx`: Track Maneuver Analysis plotting with Recharts

**Other Components**:
- `BearingIndicator.tsx`: Circular bearing display
- `TargetInfo.tsx`: Target classification and details
- `ControlPanel.tsx`: Audio controls and time compression
- `ListenerControls.tsx`: Rotation and position controls
- `TargetMesh.tsx`: Individual target 3D representation

## Type System

Centralized types in `src/types/index.ts`:
- `Target`: Position, velocity, course, speed, depth, acoustic signature
- `AcousticSignature`: Engine frequencies, harmonics, blade count, shaft RPM, cavitation, vessel type
- `VesselType`: SURFACE, SUBMARINE, MERCHANT, WARSHIP, UNKNOWN
- `ClassificationStatus`: UNDETECTED → DETECTED → ANALYZING → IDENTIFIED progression
- `SonarState`: Main state shape
- `LOFARData`, `DEMONData`, `BearingReading`: Analysis data structures

## Important Notes

- **Audio initialization**: Must happen after user gesture; check `isAudioInitialized` flag before operations
- **Singleton audio**: Single `AudioEngine` instance managed in dashboard; do not create new instances
- **Path alias**: Use `@/` for imports to `src/` directory (configured in `tsconfig.json` and `vite.config.ts`)
- **Time compression**: Affects physics in game loop but not audio pitch (1x, 10x, etc.)
- **Bearing calculation**: Degrees clockwise from north (0° = +Z, 90° = +X); atan2(dx, dz) converted to degrees
- **Default targets**: Two targets created at startup at (500, 0, 0) and (-300, 0, 400) with default acoustic signatures
- **Deployment**: Uses base path `/sonarman-kimi-k2.5/` in Vite config for GitHub Pages; repository is hosted at https://idgmatrix.github.io/sonarman-kimi-k2.5/
- **Strict mode**: TypeScript enforces strict type checking
- **Styling**: Custom Tailwind config defines a `sonar` theme with dark ocean colors and accent green (#00ff88)
- **No source tests**: Test files don't exist in the source code (tests are only in node_modules dependencies)
