// /Users/montysharma/V11M2/src/pages/ContentCreator.tsx

import React from 'react';
import ContentStudio from '../components/ContentStudio';

const ContentCreator: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Creator</h1>
              <p className="text-gray-600 mt-1">
                Design and manage storylets, characters, and game content with professional tools
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <span>🎨</span>
                <span>Creator Mode</span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <span>🔧</span>
                  <span>Development Build</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Studio - Full Page */}
      <div className="relative">
        <ContentStudio />
      </div>
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='2'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='54' cy='54' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  );
};

export default ContentCreator;