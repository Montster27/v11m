# System Patterns

## Architecture Approach
- Single Page Application (SPA) with client-side routing
- Component-based architecture using React 18
- Utility-first CSS approach with Tailwind
- State management with Zustand stores
- TypeScript for comprehensive type safety
- Real-time simulation engine with interval-based ticking

## Key Technical Decisions
- **Vite** for fast development and optimized building
- **React Router v6** for declarative routing with nested routes
- **Zustand** over Redux for simpler state management with less boilerplate
- **Tailwind CSS** for rapid UI development and consistent design system
- **TypeScript** for better developer experience and runtime safety
- **Modular architecture** with clear separation of concerns
- **localStorage** for character data persistence
- **Component composition** over inheritance patterns

## Component Structure
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Slider.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ProgressBadge.tsx
│   ├── CharacterCreation/    # Multi-step wizard components
│   ├── TimeAllocationPanel.tsx
│   ├── ResourcePanel.tsx
│   ├── CurrentEventPanel.tsx
│   └── Navigation.tsx
├── pages/                  # Route-based page components
│   ├── Home.tsx
│   ├── Planner.tsx
│   ├── CharacterCreation.tsx
│   └── Quests.tsx
├── store/                  # Zustand store definitions
│   ├── useAppStore.ts
│   └── characterStore.ts
├── utils/                  # Utility functions and calculations
│   ├── resourceCalculations.ts
│   ├── validation.ts
│   └── testCharacter.ts
├── engine/                 # Game logic engines
│   └── questEngine.ts
└── types/                  # TypeScript type definitions
    └── character.ts
```

## State Management Pattern
- **Zustand stores** for global application state
- **Local component state** for UI-specific data (useState)
- **Props drilling** minimized through store subscriptions
- **Store slices** for different feature areas:
  - `useAppStore`: Main simulation state, resources, time allocation
  - `characterStore`: Character creation, management, persistence
- **Computed values** derived from store state
- **Actions** encapsulated within stores for state mutations

## Data Flow Architecture
```
User Input (Sliders) → Store Actions → State Updates → Component Re-renders
                              ↓
                      Simulation Engine → Resource Calculations → Quest Engine
```

## Real-Time Simulation Pattern
- **Interval-based ticking**: setInterval(simulateTick, 3000)
- **Fresh state access**: useAppStore.getState() on each tick
- **Atomic updates**: Single setState call per tick
- **Cleanup handling**: clearInterval on component unmount
- **Pause/resume controls**: Interval management with state flags

## Component Communication Patterns
- **Store subscriptions** for cross-component state sharing
- **Props interface** for parent-child communication
- **Event callbacks** for user interactions
- **Context avoided** in favor of Zustand for global state
- **Ref patterns** for direct DOM manipulation (intervals)

## Error Handling Patterns
- **Validation layers**: Input validation, business logic validation
- **Boundary conditions**: Min/max resource values, percentage bounds
- **Graceful degradation**: Fallbacks for missing character data
- **User feedback**: Visual indicators for validation states
- **Console logging**: Debug information for development

## Performance Patterns
- **Component memoization**: React.memo where beneficial
- **Selective subscriptions**: Only subscribe to needed store slices
- **Lazy loading**: Dynamic imports for quest engine
- **Efficient re-renders**: Minimal state updates per tick
- **Resource calculation optimization**: Character modifier caching

## Styling Patterns
- **Utility-first approach** with Tailwind CSS
- **Component-scoped styling** through className props
- **Consistent design tokens** through Tailwind configuration
- **Responsive design** with mobile-first breakpoints
- **Color system**: Resource-specific color coding
- **Animation patterns**: CSS transitions for state changes

## Type Safety Patterns
- **Interface definitions** for all data structures
- **Strict TypeScript** configuration with comprehensive checks
- **Type exports** from store files for component consumption
- **Generic components** with proper type constraints
- **Enum usage** for finite state values

## Testing Patterns (Implemented)
- **Manual testing** with comprehensive user workflows
- **Console debugging** with detailed logging
- **State inspection** through React DevTools
- **Real-time validation** with immediate feedback
- **Cross-browser compatibility** testing

## File Organization Patterns
- **Feature-based grouping** for related components
- **Separation of concerns**: UI, logic, data, types
- **Index files** for clean imports
- **Consistent naming**: PascalCase for components, camelCase for functions
- **Co-location**: Related files grouped by feature

## Configuration Management
- **Environment-specific** settings through Vite
- **Build configuration** in vite.config.ts
- **Styling configuration** in tailwind.config.js
- **TypeScript configuration** with strict settings
- **Development tools** configuration (ESLint, etc.)

## Data Persistence Patterns
- **localStorage integration** for character data
- **JSON serialization** for complex objects
- **Error handling** for storage failures
- **Automatic persistence** on character updates
- **Data migration** patterns for schema changes

## Extension Patterns
- **Plugin architecture** for quest engine
- **Modular components** for easy feature addition
- **Configuration-driven** behavior where possible
- **Hook patterns** for reusable logic
- **Utility functions** for complex calculations

## Development Workflow Patterns
- **Memory bank documentation** for context preservation
- **Incremental development** with working prototypes
- **Component-first development** with isolated testing
- **Store-driven architecture** with clear data flow
- **Type-driven development** with interfaces first
