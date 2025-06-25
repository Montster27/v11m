// /Users/montysharma/V11M2/src/components/SkillsPanel.tsx

import React, { useState, useEffect } from 'react';
import { useCoreGameStore } from '../stores/v2';
import { ProgressBar } from './ui';
import { getCurrentLevelXpRange } from '../utils/skillCalculations';

// Make useCoreGameStore available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).useCoreGameStore = useCoreGameStore;
  (window as any).testSkills = () => {
    const store = useCoreGameStore.getState();
    console.log('Current skills state:', store.skills);
    console.log('Note: V2 store uses a different skill structure');
  };
}

interface SkillDetailModalProps {
  isOpen: boolean;
  skill: any;
  events: any[];
  onClose: () => void;
}

const SkillDetailModal: React.FC<SkillDetailModalProps> = ({ isOpen, skill, events, onClose }) => {
  if (!isOpen || !skill) return null;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const { currentLevelXp, totalLevelXp } = getCurrentLevelXpRange(skill.xp);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{skill.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  Level {skill.level}
                </span>
                <span className="text-sm text-gray-600">
                  {skill.xp} total XP
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar
              current={currentLevelXp}
              max={totalLevelXp}
              color="purple"
              label={`Progress to Level ${skill.level + 1}`}
              showValues={true}
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{skill.description}</p>
          </div>

          {/* Recent XP Events */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent XP Events</h3>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        +{event.amount} XP from '{event.source}'
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      +{event.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📚</div>
                <p>No XP events yet. Start gaining experience!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillsPanel: React.FC = () => {
  const skills = useCoreGameStore((state) => state.skills);
  const updateSkills = useCoreGameStore((state) => state.updateSkills);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [skillEvents, setSkillEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Convert V2 skill structure to match the component's expectations
  // For now, we'll create a basic structure - this needs to be adapted based on actual V2 skill structure
  const legacySkills = {
    bureaucraticNavigation: {
      id: 'bureaucraticNavigation',
      name: 'Bureaucratic Navigation',
      description: 'Mastery of institutional systems and navigating complex structures.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    resourceAcquisition: {
      id: 'resourceAcquisition',
      name: 'Resource Acquisition',
      description: 'Skill in finding and securing resources and opportunities.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    informationWarfare: {
      id: 'informationWarfare',
      name: 'Information Warfare',
      description: 'Strategic intelligence gathering and data analysis.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    allianceBuilding: {
      id: 'allianceBuilding',
      name: 'Alliance Building',
      description: 'Creating and maintaining strategic partnerships.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    operationalSecurity: {
      id: 'operationalSecurity',
      name: 'Operational Security',
      description: 'Protecting sensitive activities and managing risk.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    perseverance: {
      id: 'perseverance',
      name: 'Perseverance',
      description: 'Mental toughness to push through challenges.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    }
  };
  
  const getSkillEvents = (skillId: string, limit: number) => {
    // V2 stores don't have skill events tracking yet
    return [];
  };

  // Initialize test data in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 Skills Panel loaded with V2 store');
      console.log('📊 V2 Skills structure:', skills);
    }
  }, []);

  const simulateSkillGainsForPreview = () => {
    // V2 stores handle skills differently - this needs to be adapted
    console.log('Skill preview disabled for V2 stores - needs implementation');
  };

  const handleSkillClick = (skill: any) => {
    setSelectedSkill(skill);
    const events = getSkillEvents(skill.id, 10);
    setSkillEvents(events);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSkill(null);
    setSkillEvents([]);
  };

  const { currentLevelXp, totalLevelXp } = selectedSkill 
    ? getCurrentLevelXpRange(selectedSkill.xp)
    : { currentLevelXp: 0, totalLevelXp: 100 };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Infiltration Skills</h2>
        <p className="text-gray-600">
          Develop your skills through various activities and challenges
        </p>
      </div>

      {/* Skills Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(legacySkills).map((skill) => {
            const { currentLevelXp, totalLevelXp } = getCurrentLevelXpRange(skill.xp);
            
            return (
              <div
                key={skill.id}
                onClick={() => handleSkillClick(skill)}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {skill.name}
                  </h3>
                  <span className="text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded whitespace-nowrap">
                    Lv. {skill.level}
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-600 mb-3 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                  {skill.description}
                </p>
                
                <ProgressBar
                  className="mt-3"
                  current={currentLevelXp}
                  max={totalLevelXp}
                  color="purple"
                  showValues={false}
                />
                
                <p className="mt-2 text-xs text-gray-500">
                  {currentLevelXp} / {totalLevelXp} XP to next level
                </p>
              </div>
            );
          })}
        </div>

        {/* Development Helper */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              🧪 Development Testing
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-blue-700">
                Test skill XP gain via browser console:
              </p>
              <div className="space-y-1">
                <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 block">
                  testSkills()  // Add XP to multiple skills
                </code>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 block">
                  console.log('V2 stores use different skill methods')
                </code>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800 block">
                  console.log('Skill XP addition needs V2 implementation')
                </code>
              </div>
              <button 
                onClick={() => (window as any).testSkills?.()}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Run Test Skills
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skill Detail Modal */}
      <SkillDetailModal
        isOpen={showModal}
        skill={selectedSkill}
        events={skillEvents}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default SkillsPanel;
