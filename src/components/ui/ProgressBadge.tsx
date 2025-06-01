// /Users/montysharma/V11M2/src/components/ui/ProgressBadge.tsx
import React from 'react';

interface ProgressBadgeProps {
  title: string;
  value: string | number;
  color: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'teal';
  className?: string;
}

const ProgressBadge: React.FC<ProgressBadgeProps> = ({
  title,
  value,
  color,
  className = ''
}) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200'
  };

  return (
    <div className={`
      px-4 py-3 rounded-lg border font-medium text-center min-w-[120px]
      ${colorClasses[color]} ${className}
    `}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{title}</div>
    </div>
  );
};

export default ProgressBadge;