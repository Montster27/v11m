# Contributing to MMV

Thank you for your interest in contributing to the MMV Life Simulation Game! This document provides guidelines and information for developers joining the project.

## Quick Start for New Developers

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd V11M2

# Run the setup script (recommended)
bash scripts/setup-dev.sh  # macOS/Linux
# or
scripts\setup-dev.bat      # Windows

# Or manual setup
npm install
cp .env.example .env.local
npm run verify
```

### 2. Development Workflow
```bash
# Start development server
npm run dev

# In another terminal, optionally run Electron
npm run electron

# Before committing
npm run verify  # Type check + lint + build
```

## Project Overview

MMV is a React + TypeScript application that gamifies personal life management. Key features include:

- **Character System**: Create and develop characters with attributes
- **Quest Management**: Dynamic quest generation and completion tracking
- **Storylet System**: Interactive narrative events that affect progression
- **Save System**: Multiple save slots with detailed progress tracking
- **Skills & Resources**: XP-based progression and resource management

## Development Guidelines

### Code Standards
- **Keep it Simple**: Prefer readable, simple solutions
- **No Duplication**: Check for existing similar functionality first
- **Focused Changes**: Only modify code related to your task
- **File Size**: Keep components under 200-300 lines
- **Environment Awareness**: Consider dev, test, and production environments

### Technology Stack
- **React 19** + **TypeScript** for UI and type safety
- **Vite** for fast development and building
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Electron** for desktop app packaging

### Code Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages  
├── store/         # Zustand state stores
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Development Process

### Before Starting Work
1. **Read the Memory Bank**: Check `memoryBank/activeContext.md` to understand current state
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Understand the task**: Make sure you know what needs to be done

### During Development
1. **Follow existing patterns**: Look at similar components/features
2. **Use TypeScript**: Define proper types for all data structures
3. **Test as you go**: Verify changes in both web and Electron versions
4. **Keep Memory Bank updated**: Document significant decisions

### Before Submitting
1. **Run verification**: `npm run verify`
2. **Test thoroughly**: Web app, Electron app, different screen sizes
3. **Check git status**: Only commit files related to your changes
4. **Write good commit messages**: Follow conventional commit format

## Common Development Tasks

### Adding a New Component
1. Create component in appropriate folder
2. Define TypeScript interfaces for props
3. Use existing Tailwind CSS patterns
4. Export from appropriate index file
5. Add to relevant page/parent component

### Adding State Management
1. Create new store in `src/store/`
2. Define state shape and actions
3. Use Zustand patterns from existing stores
4. Connect to components via hooks
5. Document store purpose and usage

### Modifying Existing Features
1. **Understand the current implementation** first
2. **Check impact on other areas** of the codebase
3. **Preserve existing patterns** unless explicitly changing them
4. **Test thoroughly** to ensure no regressions
5. **Update documentation** if behavior changes

## Testing Guidelines

### Manual Testing Checklist
- [ ] Web version works at `localhost:5173`
- [ ] Electron version launches and functions
- [ ] Save/load functionality works correctly
- [ ] Responsive design works on mobile/desktop
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors

### Console Testing
The app provides debug utilities in development:
```javascript
// Save system testing
createTestSave('TestUser')
listSaves()
exportSave(saveId)

// Store inspection
window.useAppStore.getState()
window.useStoryletStore.getState()
```

## Troubleshooting

### Common Issues

**Build Failures**
- Run `npm run clean:install` to reset dependencies
- Check TypeScript errors with `npm run type-check`
- Verify all imports are correct

**Development Server Issues**
- Check if port 5173 is available
- Try `npm run dev:verbose` for detailed logging
- Clear browser cache and restart dev server

**Electron Issues**
- Ensure paths are relative (handled in vite.config.ts)
- Check that `NODE_ENV=development` is set
- Verify Electron binary is properly installed

**State Management Issues**
- Check if you're mutating state directly (use `set()` function)
- Verify store subscriptions and dependencies
- Use React DevTools to inspect component state

### Getting Help

1. **Check existing documentation** in `memoryBank/` and `docs/`
2. **Look at similar existing code** for patterns
3. **Use TypeScript IntelliSense** for API guidance
4. **Test in isolation** to identify the specific issue
5. **Ask questions** - better to clarify than make assumptions

## Code Review Guidelines

### For Contributors
- **Self-review first**: Check your own code for obvious issues
- **Provide context**: Explain what you changed and why
- **Test edge cases**: Think about what could go wrong
- **Update docs**: If you change behavior, update documentation

### For Reviewers
- **Check patterns**: Does code follow existing conventions?
- **Verify functionality**: Does it solve the intended problem?
- **Consider maintainability**: Is the code readable and well-organized?
- **Test thoroughly**: Verify the changes work as expected

## Memory Bank System

This project uses a unique "Memory Bank" documentation approach:

- **activeContext.md**: Current work and recent changes
- **productContext.md**: Project goals and purpose
- **techContext.md**: Technical decisions and setup
- **systemPatterns.md**: Architecture patterns and conventions
- **progress.md**: Feature completion status

**Important**: Always check these files before starting work, and update them when making significant changes.

## Release Process

### Preparing for Release
1. **Update version** in `package.json`
2. **Test thoroughly** on all platforms
3. **Update documentation** with any new features
4. **Create release builds**: `npm run dist`
5. **Verify builds** work correctly

### Version Numbering
- **Major** (1.0.0): Breaking changes or major new features
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes and small improvements

## Questions?

When in doubt:
1. Check the Memory Bank documentation
2. Look at existing code patterns
3. Test your changes thoroughly
4. Ask for clarification rather than guessing

Remember: The goal is to build a maintainable, well-documented codebase that multiple developers can work on effectively.

---

*Happy coding! 🚀*
