// /Users/montysharma/V11M2/src/components/CharacterCreation/RadarChart.tsx
import React from 'react';

interface RadarChartProps {
  attributes: {
    [key: string]: number;
  };
  size?: number;
}

const attributeInfo = [
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'memory', label: 'Memory' },
  { key: 'focus', label: 'Focus' },
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'charisma', label: 'Charisma' },
  { key: 'empathy', label: 'Empathy' },
  { key: 'communication', label: 'Communication' },
  { key: 'emotionalStability', label: 'Emotional Stability' },
  { key: 'perseverance', label: 'Perseverance' },
  { key: 'stressTolerance', label: 'Stress Tolerance' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'selfControl', label: 'Self Control' }
];

const RadarChart: React.FC<RadarChartProps> = ({ attributes, size = 300 }) => {
  const center = size / 2;
  const maxRadius = center - 40;
  const numSides = attributeInfo.length;
  const angleStep = (2 * Math.PI) / numSides;
  
  // Generate polygon points for each level (1-10)
  const generatePolygonPoints = (level: number): string => {
    const radius = (level / 10) * maxRadius;
    const points = attributeInfo.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  };
  
  // Generate data polygon
  const dataPoints = attributeInfo.map((attr, index) => {
    const value = attributes[attr.key] || 1;
    const radius = (value / 10) * maxRadius;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, value, label: attr.label };
  });
  
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  
  // Generate axis lines and labels
  const axisLines = attributeInfo.map((attr, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = center + maxRadius * Math.cos(angle);
    const endY = center + maxRadius * Math.sin(angle);
    
    // Label position (slightly outside the chart)
    const labelRadius = maxRadius + 25;
    const labelX = center + labelRadius * Math.cos(angle);
    const labelY = center + labelRadius * Math.sin(angle);
    
    return {
      line: `M${center},${center} L${endX},${endY}`,
      labelX,
      labelY,
      label: attr.label
    };
  });
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size + 100} height={size + 100} className="overflow-visible">
        {/* Background grid circles */}
        {[2, 4, 6, 8, 10].map(level => (
          <polygon
            key={level}
            points={generatePolygonPoints(level)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}
        
        {/* Axis lines */}
        {axisLines.map((axis, index) => (
          <g key={index}>
            <path
              d={axis.line}
              stroke="#9ca3af"
              strokeWidth="1"
              opacity={0.7}
            />
            <text
              x={axis.labelX}
              y={axis.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#374151"
              className="font-medium"
            >
              {axis.label}
            </text>
          </g>
        ))}
        
        {/* Data polygon */}
        <polygon
          points={dataPolygonPoints}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}
        
        {/* Center point */}
        <circle
          cx={center}
          cy={center}
          r="3"
          fill="#6b7280"
        />
      </svg>
    </div>
  );
};

export default RadarChart;