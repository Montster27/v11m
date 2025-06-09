// Emma Romance Arc - Main Export
export { emmaRomanceAct1 } from './act1-meeting';
export { emmaRomanceAct2 } from './act2-development';
export { emmaRomanceAct3 } from './act3-resolution';
export { emmaInfluenceStorylets } from './cross-arc-influence';

// Aggregate all Emma storylets for easy import
import { emmaRomanceAct1 } from './act1-meeting';
import { emmaRomanceAct2 } from './act2-development';
import { emmaRomanceAct3 } from './act3-resolution';
import { emmaInfluenceStorylets } from './cross-arc-influence';

export const emmaRomanceComplete = {
  ...emmaRomanceAct1,
  ...emmaRomanceAct2,
  ...emmaRomanceAct3,
  ...emmaInfluenceStorylets
};

// Arc metadata for tooling
export const emmaRomanceMetadata = {
  name: "Emma Romance",
  description: "A branching romance storyline exploring intellectual and emotional connections",
  estimatedLength: "6-8 storylets",
  prerequisites: ["college_started"],
  outcomes: ["romantic_success", "friendship_success", "academic_success", "terminal_failure"],
  crossArcInfluence: ["Political Awakening", "Academic Journey"]
};