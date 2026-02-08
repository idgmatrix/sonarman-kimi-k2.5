import React from 'react';
import { useSonarStore } from '@/store/sonarStore';

export const BearingIndicator: React.FC = () => {
  const targets = useSonarStore(state => state.targets);
  const listenerPosition = useSonarStore(state => state.listenerPosition);
  const selectedTargetId = useSonarStore(state => state.selectedTargetId);
  const selectTarget = useSonarStore(state => state.selectTarget);

  const calculateBearing = (target: typeof targets[0]) => {
    const dx = target.position.x - listenerPosition.x;
    const dz = target.position.z - listenerPosition.z;
    return (Math.atan2(dx, dz) * (180 / Math.PI) + 360) % 360;
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs text-sonar-muted mb-2 uppercase tracking-wider">Bearing Indicator</h3>
      
      <div className="flex-1 relative bg-sonar-bg rounded border border-sonar-grid overflow-hidden">
        {/* Compass rose background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-30">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="1" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Cardinal directions */}
            <text x="100" y="15" textAnchor="middle" fill="#6b7280" fontSize="12">N</text>
            <text x="185" y="105" textAnchor="middle" fill="#6b7280" fontSize="12">E</text>
            <text x="100" y="195" textAnchor="middle" fill="#6b7280" fontSize="12">S</text>
            <text x="15" y="105" textAnchor="middle" fill="#6b7280" fontSize="12">W</text>
          </svg>
        </div>

        {/* Target bearings */}
        {targets.filter(t => t.detected).map((target, index) => {
          const bearing = calculateBearing(target);
          const angle = bearing - 90; // Adjust for SVG coordinate system
          const radius = 80;
          const x = 100 + radius * Math.cos(angle * Math.PI / 180);
          const y = 100 + radius * Math.sin(angle * Math.PI / 180);
          
          const isSelected = selectedTargetId === target.id;
          const colors = ['#00ff88', '#ff6b35', '#ffaa00'];
          const color = colors[index % colors.length];

          return (
            <button
              key={target.id}
              onClick={() => selectTarget(target.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div 
                className={`w-4 h-4 rounded-full border-2 ${isSelected ? 'scale-125' : ''}`}
                style={{ 
                  backgroundColor: color,
                  borderColor: isSelected ? '#fff' : color,
                  boxShadow: isSelected ? `0 0 10px ${color}` : 'none'
                }}
              />
              <div 
                className="absolute top-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap font-mono"


                style={{ color }}
              >
                {bearing.toFixed(1)}°
              </div>
            </button>
          );
        })}

        {/* Center (ownship) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-sonar-accent rotate-45" />
        </div>
      </div>

      {/* Bearing list */}
      <div className="mt-2 space-y-1">
        {targets.filter(t => t.detected).map((target, index) => {
          const bearing = calculateBearing(target);
          const colors = ['#00ff88', '#ff6b35', '#ffaa00'];
          const color = colors[index % colors.length];
          
          return (
            <div 
              key={target.id}
              className="flex justify-between items-center text-xs py-1 px-2 bg-sonar-panel rounded">
              <span style={{ color }}>● Target {index + 1}</span>
              <span className="font-mono text-sonar-text">{bearing.toFixed(1)}°</span>
            </div>
          );
        })}
        {targets.filter(t => t.detected).length === 0 && (
          <div className="text-xs text-sonar-muted text-center py-2">No contacts</div>
        )}
      </div>
    </div>
  );
};