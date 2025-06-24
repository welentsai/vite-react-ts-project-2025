// src/pages/ConfigOperation/configReducer.ts

import { ConfigOperationAction, ConfigOperationState, SourcePartConfig } from './types';

export const initialState: ConfigOperationState = {
  configs: [],
  originalConfigs: [],
  isLoading: false,
  isEditing: false,
  selectedRows: [],
  modifiedRows: new Set(),
  deletedRows: new Set(),
  newRows: new Set(),
  error: null,
};

export function configOperationReducer(
  state: ConfigOperationState,
  action: ConfigOperationAction
): ConfigOperationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CONFIGS':
      return {
        ...state,
        configs: action.payload,
        originalConfigs: [...action.payload], // Store original data
        modifiedRows: new Set(),
        deletedRows: new Set(),
        newRows: new Set(),
      };

    case 'SET_EDITING':
      return {
        ...state,
        isEditing: action.payload,
        selectedRows: [],
        // Reset changes when exiting edit mode
        ...(action.payload === false && {
          modifiedRows: new Set(),
          deletedRows: new Set(),
          newRows: new Set(),
        }),
      };

    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRows: action.payload };

    case 'UPDATE_ROW': {
      const updatedConfigs = state.configs.map(config =>
        config.id === action.payload.id ? action.payload.data : config
      );
      const newModifiedRows = new Set(state.modifiedRows);

      // Only mark as modified if it's not a new row
      if (!state.newRows.has(action.payload.id)) {
        newModifiedRows.add(action.payload.id);
      }

      return {
        ...state,
        configs: updatedConfigs,
        modifiedRows: newModifiedRows,
      };
    }

    case 'ADD_ROW': {
      const newId = `new_${Date.now()}_${Math.random()}`;
      const newConfig: SourcePartConfig = { ...action.payload, id: newId };
      const newNewRows = new Set(state.newRows);
      newNewRows.add(newId);

      return {
        ...state,
        configs: [...state.configs, newConfig],
        newRows: newNewRows,
      };
    }

    case 'MARK_FOR_DELETION': {
      const newDeletedRows = new Set(state.deletedRows);

      // Toggle deletion state
      if (newDeletedRows.has(action.payload)) {
        newDeletedRows.delete(action.payload);
      } else {
        newDeletedRows.add(action.payload);
      }

      return { ...state, deletedRows: newDeletedRows };
    }

    case 'RESET_CHANGES':
      return {
        ...state,
        modifiedRows: new Set(),
        deletedRows: new Set(),
        newRows: new Set(),
        selectedRows: [],
      };

    case 'DISCARD_CHANGES':
      return {
        ...state,
        configs: [...state.originalConfigs],
        isEditing: false,
        modifiedRows: new Set(),
        deletedRows: new Set(),
        newRows: new Set(),
        selectedRows: [],
      };

    case 'IMPORT_DATA': {
      const importedConfigs = action.payload.map((config, index) => ({
        ...config,
        id: `imported_${Date.now()}_${index}`,
      }));
      const newIds = importedConfigs.map(config => config.id!);
      const newNewRows = new Set([...state.newRows, ...newIds]);

      return {
        ...state,
        configs: [...state.configs, ...importedConfigs],
        newRows: newNewRows,
      };
    }

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// Selector functions for derived state
export const getValidConfigs = (state: ConfigOperationState): SourcePartConfig[] => {
  return state.configs.filter(config => config.id && !state.deletedRows.has(config.id));
};

export const getExportableConfigs = (state: ConfigOperationState): SourcePartConfig[] => {
  return getValidConfigs(state);
};

export const hasUnsavedChanges = (state: ConfigOperationState): boolean => {
  return state.modifiedRows.size > 0 || state.deletedRows.size > 0 || state.newRows.size > 0;
};

export const getRowClassName = (config: SourcePartConfig, state: ConfigOperationState): string => {
  if (!config.id) return '';

  if (state.deletedRows.has(config.id)) return 'row-deleted';
  if (state.newRows.has(config.id)) return 'row-new';
  if (state.modifiedRows.has(config.id)) return 'row-modified';

  return '';
};
