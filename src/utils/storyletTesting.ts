// /Users/montysharma/V11M2/src/utils/storyletTesting.ts

import { useAppStore } from '../store/useAppStore';
import { useStoryletStore } from '../store/useStoryletStore';

export const testStoryletSystem = () => {
  console.log('🧪 ===== STORYLET SYSTEM TEST =====');
  
  const appState = useAppStore.getState();
  const storyletState = useStoryletStore.getState();
  
  console.log('📊 Current System State:');
  console.log('- Current Day:', appState.day);
  console.log('- Total Storylets:', Object.keys(storyletState.allStorylets).length);
  console.log('- Active Storylets:', storyletState.activeStoryletIds.length);
  console.log('- Completed Storylets:', storyletState.completedStoryletIds.length);
  console.log('- Active Flags:', Object.keys(storyletState.activeFlags).length);
  
  // Test time-based storylets
  console.log('\n⏰ Time-Based Storylets Analysis:');
  const timeStorylets = Object.values(storyletState.allStorylets).filter(
    (s: any) => s.trigger.type === 'time'
  );
  
  timeStorylets.forEach((storylet: any) => {
    const dayReq = storylet.trigger.conditions.day;
    const weekReq = storylet.trigger.conditions.week;
    const requiredDay = dayReq || (weekReq ? weekReq * 7 : null);
    const isEligible = requiredDay ? appState.day >= requiredDay : false;
    const isActive = storyletState.activeStoryletIds.includes(storylet.id);
    const isCompleted = storyletState.completedStoryletIds.includes(storylet.id);
    const onCooldown = storyletState.storyletCooldowns[storylet.id] && 
                      appState.day < storyletState.storyletCooldowns[storylet.id];
    
    console.log(`📅 ${storylet.id}:`);
    console.log(`   Required: day ${requiredDay} | Current: day ${appState.day}`);
    console.log(`   Eligible: ${isEligible} | Active: ${isActive} | Completed: ${isCompleted} | Cooldown: ${onCooldown}`);
  });
  
  // Test resource-based storylets
  console.log('\n💰 Resource-Based Storylets Analysis:');
  const resourceStorylets = Object.values(storyletState.allStorylets).filter(
    (s: any) => s.trigger.type === 'resource'
  );
  
  resourceStorylets.forEach((storylet: any) => {
    const conditions = storylet.trigger.conditions;
    const isActive = storyletState.activeStoryletIds.includes(storylet.id);
    const isCompleted = storyletState.completedStoryletIds.includes(storylet.id);
    
    console.log(`💰 ${storylet.id}:`);
    console.log(`   Conditions:`, conditions);
    console.log(`   Current Resources:`, appState.resources);
    console.log(`   Active: ${isActive} | Completed: ${isCompleted}`);
  });
  
  // Test flag-based storylets
  console.log('\n🏳️ Flag-Based Storylets Analysis:');
  const flagStorylets = Object.values(storyletState.allStorylets).filter(
    (s: any) => s.trigger.type === 'flag'
  );
  
  flagStorylets.forEach((storylet: any) => {
    const requiredFlags = storylet.trigger.conditions.flags || [];
    const isActive = storyletState.activeStoryletIds.includes(storylet.id);
    const isCompleted = storyletState.completedStoryletIds.includes(storylet.id);
    
    console.log(`🏳️ ${storylet.id}:`);
    console.log(`   Required Flags:`, requiredFlags);
    console.log(`   Current Flags:`, storyletState.activeFlags);
    console.log(`   Active: ${isActive} | Completed: ${isCompleted}`);
  });
  
  console.log('\n🔬 Running Evaluation Test...');
  storyletState.evaluateStorylets();
  
  setTimeout(() => {
    const newStoryletState = useStoryletStore.getState();
    console.log('📈 After Evaluation:');
    console.log('- Active Storylets:', newStoryletState.activeStoryletIds.length);
    console.log('- New Active IDs:', newStoryletState.activeStoryletIds);
  }, 500);
  
  return {
    totalStorylets: Object.keys(storyletState.allStorylets).length,
    activeStorylets: storyletState.activeStoryletIds.length,
    timeStorylets: timeStorylets.length,
    resourceStorylets: resourceStorylets.length,
    flagStorylets: flagStorylets.length,
    currentDay: appState.day
  };
};

export const advanceToDay = (targetDay: number) => {
  console.log(`🚀 Advancing to day ${targetDay}...`);
  
  const currentState = useAppStore.getState();
  useAppStore.setState({ day: targetDay });
  
  setTimeout(() => {
    useStoryletStore.getState().evaluateStorylets();
    console.log(`✅ Advanced to day ${targetDay} and re-evaluated storylets`);
    
    // Log results
    const newStoryletState = useStoryletStore.getState();
    console.log('📊 New state:', {
      day: targetDay,
      activeStorylets: newStoryletState.activeStoryletIds.length,
      activeIds: newStoryletState.activeStoryletIds
    });
  }, 200);
};

export const resetAndTest = () => {
  console.log('🔄 Resetting storylet system...');
  
  // Reset storylets
  useStoryletStore.getState().resetStorylets();
  
  // Reset day to 1
  useAppStore.setState({ day: 1 });
  
  setTimeout(() => {
    console.log('✅ Reset complete, running test...');
    testStoryletSystem();
  }, 300);
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testStoryletSystem = testStoryletSystem;
  (window as any).advanceToDay = advanceToDay;
  (window as any).resetAndTestStorylets = resetAndTest;
}
