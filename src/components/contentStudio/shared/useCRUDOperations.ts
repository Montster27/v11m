// /Users/montysharma/V11M2/src/components/contentStudio/shared/useCRUDOperations.ts
// Unified CRUD operations hook - preserves all existing functionality patterns

import { useState, useCallback, useMemo } from 'react';
import { UndoRedoAction } from '../../../hooks/useUndoRedo';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface CRUDEntity {
  id: string;
  name?: string;
  title?: string;
  [key: string]: any;
}

interface CRUDOperationsConfig<T extends CRUDEntity> {
  entityType: string;
  entityTypePlural?: string;
  
  // Store integration
  getAllItems: () => T[];
  createItem: (item: Omit<T, 'id'>) => T;
  updateItem: (item: T) => void;
  deleteItem: (id: string) => void;
  
  // Undo/Redo integration
  undoRedoSystem?: UndoRedoSystem;
  
  // Validation
  validateItem?: (item: Partial<T>) => { isValid: boolean; errors: Record<string, string> };
  
  // ID generation
  generateId?: () => string;
  
  // Default item factory
  createDefaultItem?: () => Omit<T, 'id'>;
}

interface CRUDOperationsReturn<T extends CRUDEntity> {
  // Data
  items: T[];
  loading: boolean;
  error: string | null;
  
  // Selected item state
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  
  // Editing state
  editingItem: T | null;
  setEditingItem: (item: T | null) => void;
  isCreating: boolean;
  
  // Modal state
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteConfirm: boolean;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  
  // Form state
  formData: Partial<T>;
  setFormData: (data: Partial<T>) => void;
  resetFormData: () => void;
  formErrors: Record<string, string>;
  
  // Search and filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  filteredItems: T[];
  
  // Operations
  handleCreate: (data: Omit<T, 'id'>) => Promise<boolean>;
  handleUpdate: (data: T) => Promise<boolean>;
  handleDelete: (id: string) => Promise<boolean>;
  handleDuplicate: (item: T) => Promise<boolean>;
  
  // Helpers
  getItemDisplayName: (item: T) => string;
  clearSelection: () => void;
  startCreate: () => void;
  startEdit: (item: T) => void;
  confirmDelete: (item: T) => void;
}

export function useCRUDOperations<T extends CRUDEntity>(
  config: CRUDOperationsConfig<T>
): CRUDOperationsReturn<T> {
  const {
    entityType,
    entityTypePlural = `${entityType}s`,
    getAllItems,
    createItem,
    updateItem,
    deleteItem,
    undoRedoSystem,
    validateItem,
    generateId = () => `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createDefaultItem
  } = config;

  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  
  // Modal state - preserving existing patterns
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<T>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Search and filtering - preserving existing patterns
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Get all items from store
  const items = useMemo(() => {
    try {
      return getAllItems();
    } catch (err) {
      console.error(`Error getting ${entityTypePlural}:`, err);
      setError(`Failed to load ${entityTypePlural}`);
      return [];
    }
  }, [getAllItems, entityTypePlural]);

  // Computed values
  const isCreating = showCreateModal || (editingItem === null && showEditModal);

  // Display name helper - preserving existing naming patterns
  const getItemDisplayName = useCallback((item: T): string => {
    return item.title || item.name || item.id || 'Untitled';
  }, []);

  // Filtering logic - preserving existing filter patterns
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const displayName = getItemDisplayName(item).toLowerCase();
        const searchableText = `${displayName} ${JSON.stringify(item)}`.toLowerCase();
        return searchableText.includes(query);
      });
    }

    // Type filter
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(item => {
        // This can be customized per entity type
        if ('storyArc' in item) {
          return filterType === 'all' || (item as any).storyArc === filterType;
        }
        if ('category' in item) {
          return filterType === 'all' || (item as any).category === filterType;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sortBy] || getItemDisplayName(a);
      const bValue = (b as any)[sortBy] || getItemDisplayName(b);
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      return 0;
    });

    return filtered;
  }, [items, searchQuery, filterType, sortBy, getItemDisplayName]);

  // Form data reset
  const resetFormData = useCallback(() => {
    if (createDefaultItem) {
      setFormData(createDefaultItem());
    } else {
      setFormData({});
    }
    setFormErrors({});
  }, [createDefaultItem]);

  // Create operation with undo/redo
  const handleCreate = useCallback(async (data: Omit<T, 'id'>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (validateItem) {
        const validation = validateItem(data);
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          return false;
        }
      }

      const newItem = createItem(data);
      
      // Undo/Redo integration
      if (undoRedoSystem) {
        const undoRedoAction: UndoRedoAction = {
          id: `create_${entityType}_${Date.now()}`,
          description: `Create ${entityType}: ${getItemDisplayName(newItem)}`,
          timestamp: new Date(),
          redoAction: () => createItem(data),
          undoAction: () => deleteItem(newItem.id),
          data: { type: 'create', entityType, item: newItem }
        };
        undoRedoSystem.executeAction(undoRedoAction);
      }

      // Update UI state
      setSelectedItem(newItem);
      setShowCreateModal(false);
      resetFormData();
      
      return true;
    } catch (err) {
      console.error(`Error creating ${entityType}:`, err);
      setError(`Failed to create ${entityType}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [entityType, createItem, deleteItem, validateItem, undoRedoSystem, getItemDisplayName, resetFormData]);

  // Update operation with undo/redo
  const handleUpdate = useCallback(async (data: T): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (validateItem) {
        const validation = validateItem(data);
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          return false;
        }
      }

      const originalItem = items.find(item => item.id === data.id);
      if (!originalItem) {
        throw new Error(`${entityType} not found`);
      }

      updateItem(data);
      
      // Undo/Redo integration
      if (undoRedoSystem) {
        const undoRedoAction: UndoRedoAction = {
          id: `update_${entityType}_${Date.now()}`,
          description: `Update ${entityType}: ${getItemDisplayName(data)}`,
          timestamp: new Date(),
          redoAction: () => updateItem(data),
          undoAction: () => updateItem(originalItem),
          data: { type: 'update', entityType, oldItem: originalItem, newItem: data }
        };
        undoRedoSystem.executeAction(undoRedoAction);
      }

      // Update UI state
      setSelectedItem(data);
      setEditingItem(null);
      setShowEditModal(false);
      resetFormData();
      
      return true;
    } catch (err) {
      console.error(`Error updating ${entityType}:`, err);
      setError(`Failed to update ${entityType}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [entityType, items, updateItem, validateItem, undoRedoSystem, getItemDisplayName, resetFormData]);

  // Delete operation with undo/redo
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const itemToDelete = items.find(item => item.id === id);
      if (!itemToDelete) {
        throw new Error(`${entityType} not found`);
      }

      deleteItem(id);
      
      // Undo/Redo integration
      if (undoRedoSystem) {
        const undoRedoAction: UndoRedoAction = {
          id: `delete_${entityType}_${Date.now()}`,
          description: `Delete ${entityType}: ${getItemDisplayName(itemToDelete)}`,
          timestamp: new Date(),
          redoAction: () => deleteItem(id),
          undoAction: () => createItem(itemToDelete),
          data: { type: 'delete', entityType, item: itemToDelete }
        };
        undoRedoSystem.executeAction(undoRedoAction);
      }

      // Update UI state
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      if (editingItem?.id === id) {
        setEditingItem(null);
      }
      setShowDeleteConfirm(false);
      
      return true;
    } catch (err) {
      console.error(`Error deleting ${entityType}:`, err);
      setError(`Failed to delete ${entityType}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [entityType, items, deleteItem, undoRedoSystem, getItemDisplayName, selectedItem, editingItem]);

  // Duplicate operation
  const handleDuplicate = useCallback(async (item: T): Promise<boolean> => {
    try {
      const duplicatedData = {
        ...item,
        name: item.name ? `${item.name} (Copy)` : undefined,
        title: item.title ? `${item.title} (Copy)` : undefined
      };
      delete (duplicatedData as any).id; // Remove ID to create new one
      
      return await handleCreate(duplicatedData);
    } catch (err) {
      console.error(`Error duplicating ${entityType}:`, err);
      setError(`Failed to duplicate ${entityType}`);
      return false;
    }
  }, [entityType, handleCreate]);

  // UI action helpers
  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setEditingItem(null);
  }, []);

  const startCreate = useCallback(() => {
    resetFormData();
    setEditingItem(null);
    setShowCreateModal(true);
  }, [resetFormData]);

  const startEdit = useCallback((item: T) => {
    setFormData(item);
    setEditingItem(item);
    setShowEditModal(true);
  }, []);

  const confirmDelete = useCallback((item: T) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  }, []);

  return {
    // Data
    items,
    loading,
    error,
    
    // Selection state
    selectedItem,
    setSelectedItem,
    
    // Editing state
    editingItem,
    setEditingItem,
    isCreating,
    
    // Modal state
    showCreateModal,
    showEditModal,
    showDeleteConfirm,
    setShowCreateModal,
    setShowEditModal,
    setShowDeleteConfirm,
    
    // Form state
    formData,
    setFormData,
    resetFormData,
    formErrors,
    
    // Search and filtering
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    filteredItems,
    
    // Operations
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDuplicate,
    
    // Helpers
    getItemDisplayName,
    clearSelection,
    startCreate,
    startEdit,
    confirmDelete
  };
}