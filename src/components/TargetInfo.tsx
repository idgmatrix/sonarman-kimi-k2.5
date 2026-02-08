import React from 'react';
import { useSonarStore } from '@/store/sonarStore';
import { ClassificationStatus } from '@/types';

export const TargetInfo: React.FC = () => {
  const targets = useSonarStore(state => state.targets);
  const selectedTargetId = useSonarStore(state => state.selectedTargetId);
  const classifyTarget = useSonarStore(state => state.classifyTarget);
  
  const selectedTarget = targets.find(t => t.id === selectedTargetId);
  const detectedTargets = targets.filter(t => t.detected);

  const getStatusColor = (status: ClassificationStatus) => {
    switch (status) {
      case ClassificationStatus.IDENTIFIED: return 'text-sonar-accent';
      case ClassificationStatus.ANALYZING: return 'text-yellow-400';
      case ClassificationStatus.DETECTED: return 'text-sonar-warning';
      default: return 'text-sonar-muted';
    }
  };

  const calculateRange = (target: typeof targets[0]) => {
    const dx = target.position.x;
    const dz = target.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs text-sonar-muted mb-2 uppercase tracking-wider">Target Information</h3>

      {selectedTarget ? (
        <div className="flex-1 space-y-3">
          <div className="bg-sonar-panel/90 backdrop-blur rounded p-3 border border-sonar-grid">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sonar-accent font-bold">Target {targets.indexOf(selectedTarget) + 1}</span>
              <span className={`text-xs ${getStatusColor(selectedTarget.classification)}`}>
                {selectedTarget.classification}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-sonar-muted">Range</div>
                <div className="font-mono text-sonar-text">
                  {(calculateRange(selectedTarget) / 100).toFixed(1)} kyds
                </div>
              </div>
              <div>
                <div className="text-sonar-muted">Bearing</div>
                <div className="font-mono text-sonar-text">
                  {((Math.atan2(selectedTarget.position.x, selectedTarget.position.z) * 180 / Math.PI + 360) % 360).toFixed(1)}°
                </div>
              </div>
              <div>
                <div className="text-sonar-muted">Course</div>
                <div className="font-mono text-sonar-text">
                  {selectedTarget.course.toFixed(1)}°
                </div>
              </div>
              <div>
                <div className="text-sonar-muted">Speed</div>
                <div className="font-mono text-sonar-text">
                  {selectedTarget.speed.toFixed(1)} kts
                </div>
              </div>
              <div>
                <div className="text-sonar-muted">Depth</div>
                <div className="font-mono text-sonar-text">
                  {selectedTarget.depth.toFixed(0)} ft
                </div>
              </div>
            </div>
          </div>

          {/* Acoustic Signature */}
          <div className="bg-sonar-panel/90 backdrop-blur rounded p-3 border border-sonar-grid">
            <div className="text-xs text-sonar-muted mb-2">ACOUSTIC SIGNATURE</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-sonar-muted">Engine Freq</span>
                <span className="font-mono text-sonar-text">{selectedTarget.signature.engineFreq} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sonar-muted">Shaft RPM</span>
                <span className="font-mono text-sonar-text">{selectedTarget.signature.shaftRPM} RPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sonar-muted">Blade Count</span>
                <span className="font-mono text-sonar-text">{selectedTarget.signature.bladeCount}</span>
              </div>
            </div>
          </div>

          {/* Classification actions */}
          {selectedTarget.classification !== ClassificationStatus.IDENTIFIED && (
            <div className="flex gap-2">
              <button
                onClick={() => classifyTarget(selectedTarget.id, ClassificationStatus.ANALYZING)}
                className="flex-1 py-1 px-2 bg-yellow-900/30 border border-yellow-600 text-yellow-400 text-xs rounded hover:bg-yellow-900/50 transition-colors">
                ANALYZING
              </button>
              <button
                onClick={() => classifyTarget(selectedTarget.id, ClassificationStatus.IDENTIFIED)}
                className="flex-1 py-1 px-2 bg-green-900/30 border border-green-600 text-green-400 text-xs rounded hover:bg-green-900/50 transition-colors">
                IDENTIFY
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-sonar-muted">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-sm">Select a target</div>
          <div className="text-xs mt-2">Click on a contact in the tactical view</div>
        </div>
      )}

      {/* Target list */}
      <div className="mt-3 pt-3 border-t border-sonar-grid">
        <div className="text-xs text-sonar-muted mb-2">CONTACTS ({detectedTargets.length})</div>
        <div className="space-y-1">
          {targets.map((target, index) => (
            <button
              key={target.id}
              onClick={() => target.detected && selectedTargetId !== target.id ? classifyTarget(target.id, ClassificationStatus.ANALYZING) : null}
              className={`w-full text-left py-1 px-2 rounded text-xs flex justify-between items-center ${
                selectedTargetId === target.id
                  ? 'bg-sonar-grid text-sonar-accent'
                  : 'bg-sonar-bg text-sonar-muted hover:bg-sonar-panel'
              } ${!target.detected ? 'opacity-50' : ''}`}
            >
              <span>Target {index + 1}</span>
              <span className={getStatusColor(target.classification)}>
                {target.classification === ClassificationStatus.UNDETECTED ? '---' : target.classification.slice(0, 4)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};