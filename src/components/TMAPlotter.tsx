import React from 'react';
import { useSonarStore } from '@/store/sonarStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const TMAPlotter: React.FC = () => {
  const bearingHistory = useSonarStore(state => state.bearingHistory);
  const targets = useSonarStore(state => state.targets);
  const selectedTargetId = useSonarStore(state => state.selectedTargetId);

  // Prepare data for chart
  const prepareData = () => {
    //const data: any[] = [];
    
    // Find time range
    let minTime = Infinity;
    let maxTime = -Infinity;
    
    targets.forEach(target => {
      const history = bearingHistory.get(target.id) || [];
      history.forEach(reading => {
        minTime = Math.min(minTime, reading.timestamp);
        maxTime = Math.max(maxTime, reading.timestamp);
      });
    });

    if (minTime === Infinity) return [];

    // Create time buckets (every 5 seconds)
    const bucketSize = 5000;
    const buckets = new Map<number, any>();

    for (let t = minTime; t <= maxTime; t += bucketSize) {
      buckets.set(t, { time: (t - minTime) / 1000 });
    }

    // Fill in bearing data
    targets.forEach(target => {
      const history = bearingHistory.get(target.id) || [];
      history.forEach(reading => {
        const bucketTime = Math.floor(reading

.timestamp / bucketSize) * bucketSize;
        const bucket = buckets.get(bucketTime);
        if (bucket) {
          bucket[target.id] = reading.bearing;
        }
      });
    });

    return Array.from(buckets.values());
  };

  const data = prepareData();
  const colors = ['#00ff88', '#ff6b35', '#ffaa00', '#00aaff'];

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              tickFormatter={(value) => `${value}s`}
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -10, fill: '#6b7280' }}
            />
            <YAxis 
              domain={[0, 360]} 
              stroke="#6b7280"
              tickFormatter={(value) =>

 `${value}°`}
              label={{ value: 'Bearing', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111827', 
                border: '1px solid #374151',
                borderRadius: '4px'
              }}
              labelStyle={{ color: '#6b7280' }}
            />
            
            {/* Cardinal directions */}
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="3 3" />
            <ReferenceLine y={90} stroke="#374151" strokeDasharray="3 3" />
            <ReferenceLine y={180} stroke="#374151" strokeDasharray="3 3" />
            <ReferenceLine y={270} stroke="#374151" strokeDasharray="3 3" />

            {targets.map((target, index) => (
              <Line
                key={target.id}
                type="monotone"
                dataKey={target.id}
                stroke={colors[index % colors.length]}
                strokeWidth={target.id === selectedTargetId

 ? 3 : 2}
                dot={false}
                connectNulls
                name={`Target ${index + 1}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="h-12 flex items-center gap-6 mt-4 border-t border-sonar-grid pt-2">
        {targets.map((target, index) => (
          <div 
            key={target.id} 
            className={`flex items-center gap-2 ${target.id === selectedTargetId ? 'opacity-100' : 'opacity-60'}`}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-sonar-text">
              {target.classification === 'IDENTIFIED' ? target.signature.vesselClass : `Target ${index + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};