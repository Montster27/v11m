// /Users/montysharma/V11M2/src/pages/StoryletDeveloper.tsx
import React from 'react';
import StoryletManagementPanel from '../components/StoryletManagementPanel';

const StoryletDeveloper: React.FC = () => {
  return (
    <div className="page-container min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Storylet Developer Panel</h1>
          <p className="text-lg text-gray-600">
            Manage, debug, and create storylets for the life simulation system
          </p>
        </header>

        <StoryletManagementPanel />
      </div>
    </div>
  );
};

export default StoryletDeveloper;