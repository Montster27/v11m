# Development Guidelines

## Coding Standards

### General Principles
- **Simplicity First**: Always prefer simple, readable solutions
- **DRY (Don't Repeat Yourself)**: Check for existing similar functionality before implementing
- **Environment Awareness**: Consider dev, test, and production environments
- **Focused Changes**: Only modify code related to your specific task
- **Clean Codebase**: Keep files organized and under 200-300 lines

### TypeScript & React Patterns

#### Component Structure
```typescript
// Component file structure
import React from 'react'
import { ComponentProps } from '@/types'

interface Props {
  // Define all props with proper types
}

export const ComponentName: React.FC<Props> = ({ 
  prop1, 
  prop2 
}) => {
  // Component logic
  
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  )
}
```

#### State Management with Zustand
```typescript
// Store pattern
interface StoreState {
  // State shape
}

interface StoreActions {
  // Action methods
}

export const useStoreStore = create<StoreState & StoreActions>((set, get) => ({
  // Initial state
  
  // Actions
  actionName: () => set((state) => ({
    // State updates
  })),
}))
```

#### File Organization
- Components: `/src/components/ComponentName.tsx`
- Pages: `/src/pages/PageName.tsx`
- Types: `/src/types/domain.ts`
- Stores: `/src/store/useDomainStore.ts`
- Utils: `/src/utils/utilityName.ts`

### Styling with Tailwind CSS

#### Class Organization
```typescript
// Organize classes by category
const baseClasses = "flex items-center justify-center"
const spacingClasses = "p-4 m-2 gap-3"
const colorClasses = "bg-blue-500 text-white hover:bg-blue-600"
const sizeClasses = "w-full h-12"

const className = `${baseClasses} ${spacingClasses} ${colorClasses} ${sizeClasses}`
```

#### Responsive Design
```typescript
// Mobile-first approach
className="text-sm md:text-base lg:text-lg
           p-2 md:p-4 lg:p-6
           grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/update-description` - Documentation updates

### Commit Messages
```
type(scope): description

Examples:
feat(save-system): add export functionality
fix(storylet): resolve persistence issue
refactor(components): simplify navigation logic
docs(setup): add developer guidelines
```

### Before Committing
1. **Type Check**: `npm run build:check`
2. **Lint**: `npm run lint`
3. **Test**: Verify functionality in both web and Electron
4. **Review**: Check that changes are focused and necessary

## Testing Strategy

### Manual Testing
- **Web Version**: Test at `http://localhost:5173`
- **Electron Version**: Test with `npm run electron`
- **Responsive**: Test on different screen sizes
- **Save System**: Test save/load functionality
- **Cross-browser**: Verify in Chrome, Firefox, Safari

### Console Testing
```javascript
// Development utilities available in browser console
createTestSave('DevTest')
listSaves()
exportSave(saveId)

// Store access
window.useAppStore.getState()
window.useStoryletStore.getState()
window.useSaveStore.getState()
```

## Code Review Checklist

### Before Submitting
- [ ] Code follows established patterns
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Components are under 300 lines
- [ ] No code duplication
- [ ] Tailwind classes are organized
- [ ] Responsive design considerations
- [ ] Error handling is present
- [ ] Memory Bank documentation is updated if needed

### Architecture Decisions
- [ ] New patterns are justified and documented
- [ ] Existing patterns are preserved unless explicitly changing
- [ ] State management follows Zustand patterns
- [ ] Component hierarchy is logical
- [ ] Performance implications are considered

## Common Patterns

### Error Handling
```typescript
try {
  // Operation that might fail
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Graceful fallback
  return defaultValue
}
```

### Conditional Rendering
```typescript
// Use early returns for complex conditions
if (!data) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />

return <MainContent data={data} />
```

### Event Handlers
```typescript
// Prefer inline handlers for simple operations
<button onClick={() => setCount(count + 1)}>
  Increment
</button>

// Extract complex handlers
const handleComplexOperation = useCallback(() => {
  // Complex logic
}, [dependencies])

<button onClick={handleComplexOperation}>
  Complex Action
</button>
```

## Performance Guidelines

### Component Optimization
- Use `React.memo()` for expensive components
- Use `useCallback()` and `useMemo()` judiciously
- Avoid creating objects/arrays in render
- Keep component re-renders minimal

### Bundle Optimization
- Import only what you need: `import { specific } from 'library'`
- Use dynamic imports for large dependencies
- Optimize images and assets
- Monitor bundle size with build outputs

## Documentation Requirements

### Code Comments
```typescript
/**
 * Calculates the optimal resource allocation for daily activities
 * @param activities - List of available activities
 * @param constraints - Resource and time constraints
 * @returns Optimized allocation plan
 */
const calculateOptimalAllocation = (
  activities: Activity[],
  constraints: Constraints
): AllocationPlan => {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * SaveManager Component
 * 
 * Provides save/load functionality with multiple save slots.
 * Includes import/export capabilities and save metadata display.
 * 
 * @example
 * <SaveManager 
 *   onSaveLoaded={(saveData) => handleLoad(saveData)}
 *   currentSave={currentSaveData}
 * />
 */
```

### Memory Bank Updates
- Update `activeContext.md` when starting new features
- Document architectural decisions in `systemPatterns.md`
- Keep `progress.md` current with completion status

## Debugging Tips

### Common Issues
1. **State not updating**: Check if you're mutating state directly
2. **Component not re-rendering**: Verify dependencies in hooks
3. **Build errors**: Check TypeScript types and imports
4. **Electron issues**: Verify relative paths in vite.config.ts

### Development Tools
- **React DevTools**: Component hierarchy and state inspection
- **Redux DevTools**: Works with Zustand for state debugging
- **Browser DevTools**: Network, console, and performance analysis
- **TypeScript Language Server**: Real-time type checking in IDE

## Security Considerations

### Environment Variables
- Never commit sensitive data to `.env.local`
- Use `.env.example` for documenting required variables
- Prefix client-side variables with `VITE_`

### Data Handling
- Validate user inputs
- Sanitize data before storage
- Handle file operations safely
- Avoid eval() and similar dynamic code execution

---

*These guidelines ensure consistent, maintainable, and high-quality code across the MMV project.*
