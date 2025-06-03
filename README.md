# MMV - Life Simulation Game

MMV is a web-based life simulation game built with React, TypeScript, and Vite. It helps users plan, track, and gamify their personal life goals and activities through an interactive dashboard system.

## Features

- **Time & Resource Management**: Allocate daily time across different activities
- **Character System**: Create and manage characters with unique attributes
- **Quest System**: Generate and complete quests based on your activities
- **Storylet System**: Interactive narrative events that affect your progress
- **Skills Progression**: Develop skills through activities and gain XP
- **Real-time Simulation**: Watch your character progress day by day

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Technologies
- React 19 + TypeScript
- Vite for development and building
- Zustand for state management
- Tailwind CSS for styling
- React Router for navigation

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Main application pages
- `/src/store` - Zustand state management
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/memoryBank` - Project documentation and context

---

## Original Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
