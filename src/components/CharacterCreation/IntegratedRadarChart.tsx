// /Users/montysharma/V11M2/src/components/CharacterCreation/IntegratedRadarChart.tsx
import React from 'react';
import { IntegratedCharacter } from '../../types/integratedCharacter';

interface IntegratedRadarChartProps {
  character: IntegratedCharacter;
  size?: number;
}

const domainInfo = [
  { key: 'intellectualCompetence', label: 'Intellectual', color: '#3b82f6' },
  { key: 'physicalCompetence', label: 'Physical', color: '#10b981' },
  { key: 'emotionalIntelligence', label: 'Emotional', color: '#f59e0b' },
  { key: 'socialCompetence', label: 'Social', color: '#ef4444' },
  { key: 'personalAutonomy', label: 'Autonomy', color: '#8b5cf6' },
  { key: 'identityClarity', label: 'Identity', color: '#06b6d4' },
  { key: 'lifePurpose', label: 'Purpose', color: '#84cc16' }
];

const IntegratedRadarChart: React.FC<IntegratedRadarChartProps> = ({ character, size = 300 }) => {
  const center = size / 2;
  const maxRadius = center - 50;
  const numSides = domainInfo.length;
  const angleStep = (2 * Math.PI) / numSides;
  
  // Generate polygon points for each level (0-100)
  const generatePolygonPoints = (level: number): string => {
    const radius = (level / 100) * maxRadius;
    const points = domainInfo.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  };
  
  // Generate data polygon
  const dataPoints = domainInfo.map((domain, index) => {
    const domainData = character[domain.key as keyof IntegratedCharacter] as any;
    const value = domainData?.level || 0;
    const radius = (value / 100) * maxRadius;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { 
      x, 
      y, 
      value, 
      label: domain.label, 
      color: domain.color,
      stage: domainData?.developmentStage || 1,
      confidence: domainData?.confidence || 0
    };
  });
  
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Generate axis lines and labels
  const axisLines = domainInfo.map((domain, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = center + maxRadius * Math.cos(angle);
    const endY = center + maxRadius * Math.sin(angle);
    
    // Label position (outside the chart)
    const labelRadius = maxRadius + 35;
    const labelX = center + labelRadius * Math.cos(angle);
    const labelY = center + labelRadius * Math.sin(angle);
    
    return {
      line: `M${center},${center} L${endX},${endY}`,
      labelX,
      labelY,
      label: domain.label,
      color: domain.color
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size + 120} height={size + 120} className="overflow-visible">
        {/* Background grid circles */}
        {[20, 40, 60, 80, 100].map(level => (
          <polygon
            key={level}
            points={generatePolygonPoints(level)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}
        
        {/* Level labels */}
        {[20, 40, 60, 80, 100].map(level => (
          <text
            key={`level-${level}`}
            x={center + (level / 100) * maxRadius + 5}
            y={center - 5}
            fontSize="8"
            fill="#9ca3af"
            className="font-medium"
          >
            {level}
          </text>
        ))}
        
        {/* Axis lines */}
        {axisLines.map((axis, index) => (
          <g key={`axis-${axis.label}`}>
            <path
              d={axis.line}
              stroke={axis.color}
              strokeWidth="2"
              opacity={0.3}
            />
            <text
              x={axis.labelX}
              y={axis.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill={axis.color}
              className="font-semibold"
            >
              {axis.label}
            </text>
          </g>
        ))}
        
        {/* Data polygon */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="3"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <g key={`point-${point.label}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill={point.color}
              stroke="#ffffff"
              strokeWidth="3"
            />
            <title>{`${point.label}: Level ${point.value} (Stage ${point.stage})`}</title>
          </g>
        ))}
        
        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="4"
          fill="#374151"
        />
      </svg>
      
      {/* Enhanced Legend with better responsive design */}
      {showLegend && (
        <div className="mt-6 w-full max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3" style={{ fontSize: `${legendFontSize}px` }}>
            {dataPoints.map((point, index) => (
              <div key={`legend-${point.label}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: point.color }}
                  />
                  <span className="text-gray-700 font-medium">{point.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{point.value}</span>
                  <span className="text-gray-500 text-xs">(S{point.stage})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedRadarChart;