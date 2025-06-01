// /Users/montysharma/V11M2/src/pages/Skills.tsx

import React from 'react';
import SkillsPanel from '../components/SkillsPanel';

const Skills: React.FC = () => {
  return (
    <div className="page-container min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-4">
            Skills Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Track your infiltration skills and recent progress
          </p>
        </header>

        {/* Skills Panel - Full Width */}
        <div className="mb-8">
          <SkillsPanel />
        </div>
      </div>
    </div>
  );
};

export default Skills;
