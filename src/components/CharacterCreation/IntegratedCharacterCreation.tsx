// /Users/montysharma/V11M2/src/components/CharacterCreation/IntegratedCharacterCreation.tsx
// Legacy component - redirects to ConsolidatedCharacterCreationFlow

import React from 'react';
import ConsolidatedCharacterCreationFlow from './ConsolidatedCharacterCreationFlow';

interface IntegratedCharacterCreationProps {
  onBack?: () => void;
}

/**
 * Legacy IntegratedCharacterCreation component
 * Now redirects to the new ConsolidatedCharacterCreationFlow
 * which uses the consolidated store architecture
 */
const IntegratedCharacterCreation: React.FC<IntegratedCharacterCreationProps> = () => {
  console.log('⚠️ IntegratedCharacterCreation is deprecated - using ConsolidatedCharacterCreationFlow');
  return <ConsolidatedCharacterCreationFlow />;
};

export default IntegratedCharacterCreation;