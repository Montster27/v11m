import React, { useState } from 'react';
import { useSkillSystemV2Store } from '../store/useSkillSystemV2Store';
import Button from './ui/Button';
import Card from './ui/Card';
import ProgressBar from './ui/ProgressBar';
import ProgressBadge from './ui/ProgressBadge';
import { 
  CHARACTER_CLASSES, 
  CORE_COMPETENCIES, 
  FOUNDATION_EXPERIENCES 
} from '../data/skillSystemV2Data';
import { 
  FoundationExperienceId,
  FoundationCategory,
  CoreCompetency, 
  CharacterClass,
  FoundationExperience,
  CoreCompetencySkill,
  CharacterClassSpec
} from '../types/skillSystemV2';

export const SkillSystemV2Panel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'foundations' | 'competencies' | 'classes' | 'progression'>('overview');
  const {
    foundationExperiences,
    coreCompetencies,
    characterClasses,
    unlockedClasses,
    addFoundationXP,
    addCompetencyXP,
    unlockCharacterClass,
    canUnlockClass,
    getFoundationLevel,
    getCategoryLevel,
    getCategoryTotalXP,
    getFoundationsByCategory,
    getCompetencyLevel,
    getUnlockedClasses,
    getNextClassUnlocks,
    getOverallProgress,
    calculateSynergyMultiplier
  } = useSkillSystemV2Store();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Foundation Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Academic Track</span>
              <ProgressBadge 
                title="Level" 
                value={getCategoryLevel('academic')} 
                color="blue" 
              />
            </div>
            <ProgressBar 
              current={getCategoryTotalXP('academic')} 
              max={2000} 
              className="h-2"
            />
            <div className="flex justify-between">
              <span>Working Track</span>
              <ProgressBadge 
                title="Level" 
                value={getCategoryLevel('working')} 
                color="green" 
              />
            </div>
            <ProgressBar 
              current={getCategoryTotalXP('working')} 
              max={2000} 
              className="h-2"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Core Competencies</h3>
          <div className="space-y-2">
            {Object.entries(coreCompetencies).map(([comp, competency]) => (
              <div key={comp} className="flex justify-between items-center">
                <span className="text-sm capitalize">
                  {comp.replace('-', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <ProgressBadge 
                    title="Lv" 
                    value={getCompetencyLevel(comp as CoreCompetency)} 
                    color="purple" 
                  />
                  <span className="text-xs text-gray-500">{competency.experience} XP</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Character Classes</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(CHARACTER_CLASSES).map((classSpec) => {
            const isUnlocked = getUnlockedClasses().includes(classSpec.id);
            const canUnlock = canUnlockClass(classSpec.id);
            
            return (
              <div
                key={classSpec.id}
                className={`p-3 border rounded-lg ${
                  isUnlocked 
                    ? 'bg-green-50 border-green-200' 
                    : canUnlock 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h4 className="font-medium text-sm capitalize">
                  {classSpec.id.replace('-', ' ')}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {classSpec.infiltrationTargets.join(', ')}
                </p>
                {isUnlocked && (
                  <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Unlocked
                  </span>
                )}
                {!isUnlocked && canUnlock && (
                  <Button
                    size="sm"
                    onClick={() => unlockCharacterClass(classSpec.id)}
                    className="mt-2 text-xs"
                  >
                    Unlock
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Next Milestones</h3>
        <div className="space-y-2">
          {getNextClassUnlocks().slice(0, 3).map((classId) => {
            const classSpec = Object.values(CHARACTER_CLASSES).find(c => c.id === classId);
            if (!classSpec) return null;
            
            return (
              <div key={classId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="font-medium capitalize">
                  {classId.replace('-', ' ')}
                </span>
                <span className="text-sm text-blue-600">Available to unlock</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderFoundations = () => (
    <div className="space-y-6">
      {(['academic', 'working'] as FoundationCategory[]).map((category) => (
        <Card key={category} className="p-4">
          <h3 className="text-lg font-semibold mb-4 capitalize">{category} Track</h3>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Overall Level {getCategoryLevel(category)}</span>
              <span>{getCategoryTotalXP(category)} / 2000 XP</span>
            </div>
            <ProgressBar 
              current={getCategoryTotalXP(category)} 
              max={2000} 
              className="h-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {getFoundationsByCategory(category).map((experience) => (
              <div key={experience.id} className="p-3 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">{experience.name}</h4>
                  <ProgressBadge 
                    title="Lv" 
                    value={experience.level} 
                    color="purple" 
                  />
                </div>
                <p className="text-xs text-gray-600 mb-2">{experience.description}</p>
                <div className="mb-2">
                  <ProgressBar 
                    current={experience.experience} 
                    max={100} 
                    className="h-2"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">
                    Contributes to: {experience.contributes.map(c => c.competency).join(', ')}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => addFoundationXP(experience.id, 25)}
                    className="text-xs"
                    disabled={!experience.unlocked}
                  >
                    +25 XP
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderCompetencies = () => (
    <div className="space-y-6">
      {Object.values(CORE_COMPETENCIES).map((competency) => (
        <Card key={competency.id} className="p-4">
          <h3 className="text-lg font-semibold mb-2 capitalize">
            {competency.id.replace('-', ' ')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{competency.description}</p>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Level {getCompetencyLevel(competency.id)}</span>
              <span>{coreCompetencies[competency.id]?.experience || 0} / 500 XP</span>
            </div>
            <ProgressBar 
              current={coreCompetencies[competency.id]?.experience || 0} 
              max={500} 
              className="h-3"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {competency.skills.map((skill) => (
              <div key={skill.name} className="p-3 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm">{skill.name}</h4>
                  <span className="text-xs">+{skill.xpGain} XP</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{skill.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">
                    Synergy: {skill.synergyEffect}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => addCompetencyXP(competency.id, skill.xpGain)}
                    className="text-xs"
                  >
                    Practice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      {Object.values(CHARACTER_CLASSES).map((classSpec) => {
        const isUnlocked = getUnlockedClasses().includes(classSpec.id);
        const canUnlock = canUnlockClass(classSpec.id);
        
        return (
          <Card key={classSpec.id} className={`p-4 ${
            isUnlocked 
              ? 'bg-green-50 border-green-200' 
              : canUnlock 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {classSpec.id.replace('-', ' ')}
                </h3>
                <p className="text-sm text-gray-600">
                  Infiltration Targets: {classSpec.infiltrationTargets.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isUnlocked && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    Unlocked
                  </span>
                )}
                {!isUnlocked && canUnlock && (
                  <Button
                    onClick={() => unlockCharacterClass(classSpec.id)}
                    size="sm"
                  >
                    Unlock Class
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Primary Competencies</h4>
                <div className="space-y-1">
                  {classSpec.primaryCompetencies.map((comp) => (
                    <div key={comp} className="flex justify-between text-xs">
                      <span className="capitalize">{comp.replace('-', ' ')}</span>
                      <span>Level {getCompetencyLevel(comp)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Foundation Requirements</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Academic</span>
                    <span className={getFoundationLevel('academic') >= classSpec.foundationRequirements.academic ? 'text-green-600' : 'text-red-600'}>
                      {getFoundationLevel('academic')} / {classSpec.foundationRequirements.academic}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Working</span>
                    <span className={getFoundationLevel('working') >= classSpec.foundationRequirements.working ? 'text-green-600' : 'text-red-600'}>
                      {getFoundationLevel('working')} / {classSpec.foundationRequirements.working}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Special Abilities</h4>
              <div className="space-y-2">
                {classSpec.abilities.map((ability, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <h5 className="font-medium text-xs">{ability.name}</h5>
                    <p className="text-xs text-gray-600">{ability.description}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-blue-600">
                        {ability.effect}
                      </span>
                      <span className="text-xs text-gray-500">
                        Cooldown: {ability.cooldownTurns}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderProgression = () => {
    const overallProgress = getOverallProgress();
    const synergyMultiplier = calculateSynergyMultiplier();
    
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm">Foundation Progress</span>
              <ProgressBar 
                current={overallProgress.foundationProgress} 
                max={100} 
                className="h-3 mt-1"
              />
              <span className="text-xs text-gray-500">
                {overallProgress.foundationProgress.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-sm">Competency Progress</span>
              <ProgressBar 
                current={overallProgress.competencyProgress} 
                max={100} 
                className="h-3 mt-1"
              />
              <span className="text-xs text-gray-500">
                {overallProgress.competencyProgress.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-600">
                {getUnlockedClasses().length}
              </div>
              <div className="text-xs text-gray-600">Classes Unlocked</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">
                {synergyMultiplier.toFixed(2)}x
              </div>
              <div className="text-xs text-gray-600">Synergy Multiplier</div>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <div className="text-xl font-bold text-purple-600">
                {Object.values(coreCompetencies).reduce((sum, comp) => sum + comp.experience, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Competency XP</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Development Path Analysis</h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded">
              <h4 className="font-medium text-sm">Recommended Next Steps</h4>
              <ul className="text-xs text-gray-600 mt-2 space-y-1">
                {getNextClassUnlocks().slice(0, 2).map((classId) => (
                  <li key={classId}>
                    • Focus on requirements for {classId.replace('-', ' ')}
                  </li>
                ))}
                {getNextClassUnlocks().length === 0 && (
                  <li>• Continue developing existing competencies for synergy bonuses</li>
                )}
              </ul>
            </div>
            
            <div className="p-3 bg-blue-50 rounded">
              <h4 className="font-medium text-sm">Synergy Opportunities</h4>
              <p className="text-xs text-gray-600 mt-2">
                Current synergy multiplier: {synergyMultiplier.toFixed(2)}x
                <br />
                Develop multiple competencies to unlock powerful synergy effects in operations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Skill System V2</h1>
        <p className="text-gray-600">
          Develop your character through foundation experiences, core competencies, and specialized classes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'foundations', label: 'Foundation Tracks' },
          { id: 'competencies', label: 'Core Competencies' },
          { id: 'classes', label: 'Character Classes' },
          { id: 'progression', label: 'Progression' }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'primary' : 'outline'}
            size="sm"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'foundations' && renderFoundations()}
        {activeTab === 'competencies' && renderCompetencies()}
        {activeTab === 'classes' && renderClasses()}
        {activeTab === 'progression' && renderProgression()}
      </div>
    </div>
  );
};