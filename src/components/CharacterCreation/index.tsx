// /Users/montysharma/V11M2/src/components/CharacterCreation/index.tsx
// Legacy component - redirects to ConsolidatedCharacterCreationFlow

import React from 'react';
import ConsolidatedCharacterCreationFlow from './ConsolidatedCharacterCreationFlow';

/**
 * Legacy CharacterCreation component
 * Now redirects to the new ConsolidatedCharacterCreationFlow
 * which uses the consolidated store architecture
 */
const CharacterCreation: React.FC = () => {
  console.log('⚠️ CharacterCreation is deprecated - using ConsolidatedCharacterCreationFlow');
  return <ConsolidatedCharacterCreationFlow />;
};

export default CharacterCreation;