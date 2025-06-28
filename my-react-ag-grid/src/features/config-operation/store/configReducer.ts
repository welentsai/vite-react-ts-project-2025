// src/pages/ConfigOperation/configReducer.ts

import { ConfigOperationAction, ConfigOperationState, SourcePartConfig } from '../types/types';

export const initialState: ConfigOperationState = {
  configs: [],
  originalConfigs: [],
  isLoading: false,
  isEditing: false,
  selectedRows: [],
  modifiedRows: new Set<string>(),
  deletedRows: new Set<string>(),
  newRows: new Set<string>(),
  error: null,
};

import { match } from 'ts-pattern';

export function configOperationReducer(
  state: ConfigOperationState,
  action: ConfigOperationAction
): ConfigOperationState {
  return match(action)
    .with({ type: 'SET_LOADING' }, ({ payload }) => ({
      ...state,
      isLoading: payload,
    }))
    .with({ type: 'SET_CONFIGS' }, ({ payload }) => ({
      ...state,
      configs: payload,
      originalConfigs: [...payload], // Store original data
      modifiedRows: new Set<string>(),
      deletedRows: new Set<string>(),
      newRows: new Set<string>(),
    }))
    .with({ type: 'SET_EDITING' }, ({ payload }) => ({
      ...state,
      isEditing: payload,
      selectedRows: [],
      // Reset changes when exiting edit mode
      ...(payload === false && {
        modifiedRows: new Set<string>(),
        deletedRows: new Set<string>(),
        newRows: new Set<string>(),
      }),
    }))
    .with({ type: 'SET_SELECTED_ROWS' }, ({ payload }) => ({
      ...state,
      selectedRows: payload,
    }))
    .with({ type: 'UPDATE_ROW' }, ({ payload }) => {
      const updatedConfigs = state.configs.map(config =>
        config.id === payload.id ? payload.data : config
      );
      const newModifiedRows = new Set(state.modifiedRows);

      // Only mark as modified if it's not a new row
      if (!state.newRows.has(payload.id)) {
        newModifiedRows.add(payload.id);
      }

      return {
        ...state,
        configs: updatedConfigs,
        modifiedRows: newModifiedRows,
      };
    })
    .with({ type: 'ADD_ROW' }, ({ payload }) => {
      const newId = `new_${Date.now()}_${Math.random()}`;
      const newConfig: SourcePartConfig = { ...payload, id: newId };
      const newNewRows = new Set(state.newRows);
      newNewRows.add(newId);

      return {
        ...state,
        configs: [...state.configs, newConfig],
        newRows: newNewRows,
      };
    })
    .with({ type: 'MARK_FOR_DELETION' }, ({ payload }) => {
      const newDeletedRows = new Set(state.deletedRows);

      // Toggle deletion state
      if (newDeletedRows.has(payload)) {
        newDeletedRows.delete(payload);
      } else {
        newDeletedRows.add(payload);
      }

      return { ...state, deletedRows: newDeletedRows };
    })
    .with({ type: 'RESET_CHANGES' }, () => ({
      ...state,
      modifiedRows: new Set<string>(),
      deletedRows: new Set<string>(),
      newRows: new Set<string>(),
      selectedRows: [],
    }))
    .with({ type: 'DISCARD_CHANGES' }, () => ({
      ...state,
      configs: [...state.originalConfigs],
      isEditing: false,
      modifiedRows: new Set<string>(),
      deletedRows: new Set<string>(),
      newRows: new Set<string>(),
      selectedRows: [],
    }))
    .with({ type: 'IMPORT_DATA' }, ({ payload }) => {
      const importedConfigs = payload.map((config, index) => ({
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
    })
    .with({ type: 'SET_ERROR' }, ({ payload }) => ({
      ...state,
      error: payload,
    }))
    .exhaustive();
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
