# Sonarman

A passive sonar simulation built with React, TypeScript, Three.js, and Tone.js. Visualize and simulate underwater acoustic detection using 3D scenes, audio visualization, and real-time signal processing.

[Live Demo](https://idgmatrix.github.io/sonarman-kimi-k2.5/)

## Features

- **3D Tactical View**: Underwater scene with real-time target tracking
- **Spatial Audio**: Tone.js-powered 3D audio with Doppler effect and depth-based filtering
- **Signal Processing**: LOFAR and DEMON analysis displays for frequency and blade rate detection
- **TMA Plotting**: Track Maneuver Analysis with Recharts visualization
- **Time Compression**: Accelerate simulation time for analysis

## Tech Stack

- **Frontend**: React 18 + TypeScript (strict mode)
- **Build**: Vite
- **3D Rendering**: Three.js + React Three Fiber
- **Audio**: Tone.js
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/idgmatrix/sonarman-kimi-k2.5.git
cd sonarman-kimi-k2.5

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

**Note**: Audio requires user interaction. Click anywhere in the UI to initialize the audio engine.

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

```bash
# Deploy to GitHub Pages
npm run deploy
```

## How to Use

1. **Initialize Audio**: Click anywhere on the screen to start the audio engine
2. **Navigate**: Use the controls to rotate and move the listener (sonar operator)
3. **Select Targets**: Click on targets in the 3D view to select them
4. **Analysis Displays**:
   - **LOFAR**: View frequency spectrum over time
   - **DEMON**: Analyze blade rate from cavitation noise
   - **TMA**: Track target movement and bearings
5. **Time Compression**: Use the control panel to speed up simulation time

## Architecture

### Core Components

- **`SonarDashboard`**: Main UI container with display tabs
- **`UnderwaterScene`**: 3D tactical view with React Three Fiber
- **`AudioEngine`**: Tone.js spatial audio management (singleton)
- **`sonarStore`**: Zustand store with game loop physics

### Signal Processing

- **LOFAR Processor**: FFT-based spectral analysis (up to 1kHz)
- **DEMON Processor**: Envelope detection for blade rate extraction

### Detection Logic

Targets are detected based on Signal-to-Noise Ratio (SNR):
```
SNR = cavitationLevel * 1000 / (distance * 0.1 + 1)
```

Detection threshold: SNR > 5

## Project Structure

```
src/
├── components/         # React UI components
├── three/             # 3D scene components
├── audio/             # Audio engine and processors
│   └── processors/    # LOFAR and DEMON processing
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── App.tsx
└── main.tsx
```

## Browser Compatibility

- Chrome/Edge (recommended for best audio support)
- Firefox
- Safari (may require user gesture for audio)

## License

MIT

## Acknowledgments

Built with:
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Tone.js](https://tonejs.github.io/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Recharts](https://recharts.org/)
