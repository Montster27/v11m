// /Users/montysharma/V11M2/src/test/characterFlow/index.ts
// Main entry point for character flow tests

// Export all test utilities
export * from './flowTestUtils';
export * from './splashScreenTests';
export * from './runPhase1and2Tests';

// Auto-load tests in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('📦 Character Flow Test Suite Loaded');
  console.log('====================================');
  console.log('Available test commands:');
  console.log('');
  console.log('🧪 Basic Tests:');
  console.log('  captureFlowState() - Capture current state');
  console.log('  validateCharacterCreationState(state) - Validate character');
  console.log('  validateStoreIntegrity(state) - Check store integrity');
  console.log('');
  console.log('🎮 Phase Tests:');
  console.log('  testPhase1Foundation() - Test Phase 1 components');
  console.log('  testPhase2SplashScreen() - Test Phase 2 components');
  console.log('  testPhase1and2Integration() - Test integration');
  console.log('');
  console.log('🚀 Complete Test Suite:');
  console.log('  runAllPhase1and2Tests() - Run ALL tests');
  console.log('');
  console.log('💡 Tip: Start with runAllPhase1and2Tests() for full validation');
}