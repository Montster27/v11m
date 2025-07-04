# V2 System Migration Transition Plan

**Date:** July 4, 2025  
**Status:** Phase 1 - Critical Path Migration  
**Priority:** HIGH - Data Integrity & Core Functionality

---

## 🎯 **Executive Summary**

The codebase is currently 40% migrated from legacy storylet/clue/arc systems to the new V2 consolidated architecture. This transition plan addresses the remaining 60% with focus on data integrity, core game functionality, and developer experience.

**Critical Risk:** Save/load system currently mixes legacy and V2 data, creating potential for data loss.

---

## 📊 **Current State Assessment**

### **Migration Status by System**
- **Core Game**: 60% Legacy (StoryletPanel, ArcProgressDisplay, Save/Load)
- **Content Studio**: 50% Mixed (Duplicate components, partial conversions)
- **Developer Tools**: 70% Legacy (StoryletManagement, routing)
- **Character System**: 80% V2 (Mostly complete)
- **Data Persistence**: 30% Mixed (Critical data integrity issues)

### **Key Dependencies**
- **43 components** still use `useStoryletStore`
- **21 components** still use legacy `useClueStore`
- **Save/Load system** serializes mixed legacy/V2 data
- **Routing** still directs to legacy developer pages

---

## 🗓️ **Three-Week Migration Schedule**

## **WEEK 1: Critical Path - Data Integrity & Core Game**

### **Day 1-2: Save/Load System Migration**
**Priority: CRITICAL**
- [ ] **Task 1.1**: Audit `useSaveStore.ts` legacy data serialization
- [ ] **Task 1.2**: Create V2-compatible save format
- [ ] **Task 1.3**: Implement backwards-compatible loading
- [ ] **Task 1.4**: Add save format migration utility
- [ ] **Task 1.5**: Test save/load with mixed data

**Deliverables:**
- Working save/load with V2 data
- Migration utility for existing saves
- Backwards compatibility maintained

### **Day 3-4: StoryletPanel Migration**
**Priority: HIGH**
- [ ] **Task 1.6**: Convert `StoryletPanel.tsx` to use V2 stores
- [ ] **Task 1.7**: Update storylet filtering to use V2 arc IDs
- [ ] **Task 1.8**: Migrate storylet interaction workflows
- [ ] **Task 1.9**: Update clue discovery integration
- [ ] **Task 1.10**: Test main game panel functionality

**Deliverables:**
- Fully functional StoryletPanel using V2 architecture
- No breaking changes to player experience

### **Day 5: Main Routing Update**
**Priority: HIGH**
- [ ] **Task 1.11**: Update main app routing to use refactored components
- [ ] **Task 1.12**: Switch StoryletDeveloper page to refactored version
- [ ] **Task 1.13**: Remove legacy route dependencies
- [ ] **Task 1.14**: Update navigation components

**Deliverables:**
- Main application routes to V2 components
- Legacy pages deprecated

---

## **WEEK 2: Data Consistency & Content Studio**

### **Day 6-7: Content Studio Consolidation**
**Priority: MEDIUM**
- [ ] **Task 2.1**: Remove duplicate Content Studio components
- [ ] **Task 2.2**: Complete ClueManager.tsx V2 conversion
- [ ] **Task 2.3**: Finish ArcManager.tsx migration
- [ ] **Task 2.4**: Update StoryletBrowser to single V2 version

### **Day 8-9: ClueDiscoveryManager Migration**
**Priority: HIGH**
- [ ] **Task 2.5**: Convert ClueDiscoveryManager to V2 stores
- [ ] **Task 2.6**: Update clue-to-arc relationship handling
- [ ] **Task 2.7**: Migrate minigame outcome processing
- [ ] **Task 2.8**: Test clue discovery workflow end-to-end

### **Day 10: Arc Filtering Standardization**
**Priority: MEDIUM**
- [ ] **Task 2.9**: Replace all `storylet.storyArc === arcName` patterns
- [ ] **Task 2.10**: Standardize on V2 arc ID lookups
- [ ] **Task 2.11**: Update search and filter components
- [ ] **Task 2.12**: Test filtering consistency across components

---

## **WEEK 3: Cleanup & Optimization**

### **Day 11-12: Legacy Store Removal**
**Priority: LOW**
- [ ] **Task 3.1**: Identify remaining legacy store dependencies
- [ ] **Task 3.2**: Create migration utilities for orphaned data
- [ ] **Task 3.3**: Remove unused legacy stores
- [ ] **Task 3.4**: Update imports and dependencies

### **Day 13-14: StoryArcVisualizer V2 Update**
**Priority: MEDIUM**
- [ ] **Task 3.5**: Convert StoryArcVisualizer to V2 data sources
- [ ] **Task 3.6**: Update arc visualization logic
- [ ] **Task 3.7**: Fix Overview/Visualizer data consistency
- [ ] **Task 3.8**: Test visualization accuracy

### **Day 15: Final Integration Testing**
**Priority: HIGH**
- [ ] **Task 3.9**: End-to-end testing of complete game flow
- [ ] **Task 3.10**: Validate save/load data integrity
- [ ] **Task 3.11**: Performance testing of V2 systems
- [ ] **Task 3.12**: User acceptance testing

---

## 🔧 **Implementation Details**

### **Technical Approach**

1. **Backwards Compatibility First**
   - Maintain ability to load existing saves
   - Gradual migration without breaking changes
   - Fallback mechanisms for edge cases

2. **Data Integrity Priority**
   - All migrations must preserve existing data
   - Comprehensive testing before deployment
   - Rollback capabilities for failed migrations

3. **Progressive Enhancement**
   - Components work with both systems during transition
   - Gradual removal of legacy dependencies
   - Clear deprecation warnings

### **Risk Mitigation**

1. **Save Data Loss Prevention**
   - Create backup before any save format changes
   - Implement save format versioning
   - Test migration with real player data

2. **Component Compatibility**
   - Maintain component interfaces during migration
   - Use adapter patterns where necessary
   - Extensive integration testing

3. **Performance Monitoring**
   - Benchmark V2 vs legacy performance
   - Monitor memory usage during migration
   - Identify performance regressions early

---

## 📋 **Success Criteria**

### **Week 1 Goals**
- [ ] **Save/Load System**: No data loss, backwards compatible
- [ ] **StoryletPanel**: Fully functional with V2 architecture
- [ ] **Main Routing**: All routes use V2 components
- [ ] **Zero Breaking Changes**: Existing functionality preserved

### **Week 2 Goals**
- [ ] **Content Studio**: Single set of V2 components
- [ ] **Clue Discovery**: Full V2 integration working
- [ ] **Data Consistency**: All arc filtering uses V2 patterns
- [ ] **Developer Experience**: No legacy component confusion

### **Week 3 Goals**
- [ ] **Legacy Cleanup**: Unused stores removed
- [ ] **Visualization**: StoryArcVisualizer shows accurate V2 data
- [ ] **Performance**: No regressions vs legacy system
- [ ] **Testing**: 95%+ test coverage of migrated components

---

## 🚨 **Critical Dependencies & Blockers**

### **Must Complete Before Week 2**
1. Save/load system working with V2 data
2. StoryletPanel migration complete
3. Main routing updated

### **Must Complete Before Week 3**
1. Content Studio consolidation
2. ClueDiscoveryManager V2 conversion
3. Arc filtering standardization

### **External Dependencies**
- UI testing for backwards compatibility
- Performance benchmarking tools
- Save data backup procedures

---

## 📈 **Progress Tracking**

### **Daily Standup Questions**
1. What migration tasks were completed yesterday?
2. What migration tasks are planned for today?
3. Are there any blockers or data integrity concerns?
4. Do any changes require additional testing?

### **Weekly Review Points**
- **Migration percentage** complete
- **Breaking changes** introduced (should be zero)
- **Performance impact** of V2 systems
- **Test coverage** of migrated components

### **Success Metrics**
- **0** data loss incidents
- **0** breaking changes to player experience
- **100%** backwards compatibility maintained
- **95%+** test coverage achieved

---

## 🎯 **Post-Migration Goals**

### **Immediate (Week 4)**
- Documentation update for V2 architecture
- Developer onboarding materials
- Performance optimization

### **Short-term (1 Month)**
- Advanced V2 features utilization
- Enhanced arc relationship tracking
- Improved developer tools

### **Long-term (3 Months)**
- Full V2 architecture benefits realized
- Legacy code completely removed
- Enhanced game features using V2 capabilities

---

**Document Version:** 1.0  
**Last Updated:** July 4, 2025  
**Next Review:** End of Week 1 (July 11, 2025)