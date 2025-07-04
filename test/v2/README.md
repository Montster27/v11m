# V2 Store Migration Integration Tests

Comprehensive test suite for validating the V2 store migration functionality, component integration, and system stability.

## Overview

The V2 integration tests ensure that:
- ✅ V2 stores are properly initialized and functional
- ✅ Components correctly integrate with V2 stores
- ✅ Cross-store data consistency is maintained
- ✅ Migration compatibility between V1 and V2 is preserved
- ✅ Performance meets acceptable standards
- ✅ User interactions work as expected

## Test Structure

```
test/v2/
├── README.md                      # This documentation
├── testRunner.ts                  # Main test orchestrator
├── v2IntegrationTests.ts         # Store-level integration tests
├── componentIntegrationTests.ts  # Component-level integration tests
└── [future test files]
```

## Running Tests

### Development Environment (Browser Console)

The tests are automatically loaded in development mode and exposed globally. Open browser console and run:

```javascript
// Quick health check
await runV2HealthCheck();

// Full integration test suite
const results = await runCompleteV2TestSuite();

// Individual test suites
await runV2IntegrationTests();        // Store tests only
await runComponentIntegrationTests(); // Component tests only

// Environment information
getTestEnvironmentInfo();

// Export results for analysis
const exported = exportTestResults(results);
console.log(exported);
```

### Production Testing

For production builds, tests can be imported manually:

```javascript
import { runCompleteV2TestSuite } from './test/v2/testRunner';

const results = await runCompleteV2TestSuite();
```

## Test Categories

### 1. Store Integration Tests (`v2IntegrationTests.ts`)

**Core Store Tests:**
- Store initialization and basic operations
- Method availability and functionality
- State consistency validation

**Storylet Evaluation Tests:**
- Storylet activation and completion
- Effect application (resource, flag, skillXp, unlock)
- Cooldown system functionality
- Resource requirement validation

**Story Arc Progression Tests:**
- Arc creation and management
- Progress tracking and completion
- Social store integration with arcs

**Clue Discovery Flow Tests:**
- Clue discovery and recording
- Clue connections and relationships
- Arc-clue integration

**Cross-Store Consistency Tests:**
- Data reference validation between stores
- Flag namespace integrity
- Arc reference consistency

**Performance Metrics Tests:**
- Bulk operation performance
- Serialization speed
- Memory usage validation

**Migration Compatibility Tests:**
- Legacy data format support
- V1/V2 coexistence validation
- Backwards compatibility verification

### 2. Component Integration Tests (`componentIntegrationTests.ts`)

**StoryletPanel Integration:**
- Component rendering with V2 stores
- Choice interaction and effect application
- Store state updates via UI

**DebugPanel Integration:**
- V2 store data display
- Real-time store state monitoring
- Development mode functionality

**ClueDiscoveryManager Integration:**
- Clue discovery flow with V2 stores
- Social store integration
- Discovery completion callbacks

**useAvailableStorylets Hook Integration:**
- Hook functionality with V2 stores
- Reactive updates to store changes
- Performance of storylet evaluation

## Test Results Interpretation

### Success Criteria

**✅ Excellent (95%+ success rate):**
- All critical functionality working
- Minor warnings acceptable
- Ready for production deployment

**✅ Good (80-94% success rate):**
- Core functionality stable
- Some issues need attention
- Deployment possible with fixes

**⚠️ Caution (60-79% success rate):**
- Significant issues present
- Requires investigation before deployment
- Performance or stability concerns

**🚨 Critical (<60% success rate):**
- Major functionality broken
- Should not be deployed
- Requires immediate attention

### Common Issues and Solutions

**Store Initialization Failures:**
```
Issue: V2 stores not properly initialized
Solution: Check store imports and ensure proper setup
```

**Cross-Store Consistency Errors:**
```
Issue: Invalid arc references between stores
Solution: Verify arc creation before referencing in other stores
```

**Component Rendering Issues:**
```
Issue: Components not rendering with V2 data
Solution: Check hook usage and store subscription patterns
```

**Performance Warnings:**
```
Issue: Slow operation times
Solution: Optimize store selectors and reduce unnecessary operations
```

## Extending Tests

### Adding New Store Tests

1. Add test function to `v2IntegrationTests.ts`:
```typescript
export const testNewFeature = async (): Promise<V2TestResult> => {
  // Test implementation
};
```

2. Update `runV2IntegrationTests()` to include new test
3. Add appropriate validations and error handling

### Adding New Component Tests

1. Add test function to `componentIntegrationTests.ts`:
```typescript
export const testNewComponent = async (): Promise<ComponentTestResult> => {
  // Component test implementation
};
```

2. Update `runComponentIntegrationTests()` to include new test
3. Test rendering, store integration, and user interactions

### Test Data Patterns

**Creating Test Storylets:**
```typescript
const testStorylet = createTestStorylet('test-id', {
  resources: { energy: 50 }, // Requirements
  flags: { 'prerequisite_flag': true }
});
```

**Creating Test Clues:**
```typescript
const testClue = createTestClue('test-clue-id', 'test-arc-id');
```

**Store Setup:**
```typescript
const { narrativeStore, socialStore } = setupTestStores();
```

## Performance Benchmarks

**Target Performance Standards:**
- Store initialization: < 50ms
- Bulk operations (100 items): < 100ms
- Serialization: < 50ms
- Component rendering: < 200ms
- Test suite completion: < 10s

**Memory Usage Standards:**
- Total store size: < 1MB
- Component memory leaks: 0
- Test cleanup: Complete

## Continuous Integration

### Automated Testing

Tests can be integrated into CI/CD pipelines:

```bash
# Add to package.json scripts
"test:v2": "node -e \"import('./test/v2/testRunner.js').then(m => m.runCompleteV2TestSuite())\""

# Run in CI
npm run test:v2
```

### Test Reporting

Results are automatically formatted for:
- Console output with emojis and formatting
- JSON export for analysis tools
- Environment information collection
- Performance metrics tracking

## Troubleshooting

### Common Test Failures

**"Store not initialized":**
- Ensure V2 stores are properly imported
- Check for circular dependencies
- Verify store setup in test environment

**"Component not rendering":**
- Check React Testing Library setup
- Verify mock providers are configured
- Ensure proper async handling

**"Performance warnings":**
- Check for memory leaks in test cleanup
- Optimize test data size
- Review batch operation efficiency

### Debug Mode

Enable detailed logging:
```javascript
// Set development environment
process.env.NODE_ENV = 'development';

// Run tests with profiling enabled
const results = await runCompleteV2TestSuite();
```

## Version History

**v2.0.0** - Initial V2 integration test suite
- Store-level integration tests
- Component integration tests
- Performance and compatibility validation
- Comprehensive reporting system

---

For questions or issues with the test suite, check the console output for detailed error messages and recommendations.