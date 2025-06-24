// /Users/montysharma/V11M2/src/components/contentStudio/shared/index.ts
// Shared Content Studio foundation exports

export { default as BaseStudioComponent } from './BaseStudioComponent';
export type { BaseStudioComponentProps, UndoRedoSystem } from './BaseStudioComponent';

export { useCRUDOperations } from './useCRUDOperations';
export type { CRUDOperationsReturn } from './useCRUDOperations';

export { 
  useStudioValidation, 
  commonValidationRules, 
  validationConfigs 
} from './useStudioValidation';
export type { ValidationResult, ValidationRule } from './useStudioValidation';

export { useStudioPersistence } from './useStudioPersistence';
export type { UseStudioPersistenceReturn } from './useStudioPersistence';