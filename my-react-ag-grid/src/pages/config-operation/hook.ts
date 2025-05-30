// src/pages/ConfigOperation/hook.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useCallback, useReducer } from 'react';
import {
  ConfigApiResponse,
  ConfigOperationAction,
  ConfigOperationState,
  ConfigSaveRequest,
  QueryFormData,
  SourcePartConfig,
} from './types';

const initialState: ConfigOperationState = {
  configs: [],
  isLoading: false,
  isEditing: false,
  selectedRows: [],
  modifiedRows: new Set(),
  deletedRows: new Set(),
  newRows: new Set(),
  error: null,
};

function configOperationReducer(
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
        modifiedRows: new Set(),
        deletedRows: new Set(),
        newRows: new Set(),
      };
    case 'SET_EDITING':
      return {
        ...state,
        isEditing: action.payload,
        selectedRows: [],
        modifiedRows: new Set(),
        deletedRows: new Set(),
        newRows: new Set(),
      };
    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRows: action.payload };
    case 'UPDATE_ROW': {
      const updatedConfigs = state.configs.map(config =>
        config.id === action.payload.id ? action.payload.data : config
      );
      const newModifiedRows = new Set(state.modifiedRows);
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
      const newConfig = { ...action.payload, id: newId };
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
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// API functions
const fetchConfigs = async (sourcePart: string): Promise<SourcePartConfig[]> => {
  const response = await fetch(
    `http://example.com/api/configs?sourcePart=${encodeURIComponent(sourcePart)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch configs: ${response.status}`);
  }
  const data: ConfigApiResponse = await response.json();
  return data.data.map((config, index) => ({
    ...config,
    id: config.id || `config_${index}`,
  }));
};

const saveConfigs = async (saveRequest: ConfigSaveRequest): Promise<void> => {
  const response = await fetch('http://example.com/api/configs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saveRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Save failed: ${response.status}`);
  }

  if (response.status !== 201) {
    throw new Error('Unexpected response status');
  }
};

export const useConfigOperation = () => {
  const [state, dispatch] = useReducer(configOperationReducer, initialState);
  const queryClient = useQueryClient();

  // Query for fetching configs
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['configs'],
    queryFn: () => fetchConfigs(''), // Empty initially
    enabled: false, // Only fetch when explicitly called
  });

  // Mutation for saving configs
  const saveMutation = useMutation({
    mutationFn: saveConfigs,
    onSuccess: () => {
      message.success('Configurations saved successfully');
      dispatch({ type: 'RESET_CHANGES' });
      dispatch({ type: 'SET_EDITING', payload: false });
      // Refetch data
      const currentSourcePart = state.configs[0]?.sourcePart;
      if (currentSourcePart) {
        handleSearch({ sourcePart: currentSourcePart });
      }
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      message.error(`Save failed: ${error.message}`);
    },
  });

  // Handle search
  const handleSearch = useCallback(async (formData: QueryFormData) => {
    if (!formData.sourcePart.trim()) {
      message.warning('Please enter a Source Part');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const configs = await fetchConfigs(formData.sourcePart);
      dispatch({ type: 'SET_CONFIGS', payload: configs });
      dispatch({ type: 'SET_EDITING', payload: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch configurations';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      message.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    dispatch({ type: 'SET_EDITING', payload: !state.isEditing });
  }, [state.isEditing]);

  // Handle row update
  const handleRowUpdate = useCallback((id: string, data: SourcePartConfig) => {
    dispatch({ type: 'UPDATE_ROW', payload: { id, data } });
  }, []);

  // Handle add row
  const handleAddRow = useCallback(() => {
    const newRow: SourcePartConfig = {
      sourcePart: state.configs[0]?.sourcePart || '',
      binGrade: '',
      targetPart: '',
      claimUser: '',
      claimTime: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_ROW', payload: newRow });
  }, [state.configs]);

  // Handle delete row
  const handleDeleteRow = useCallback(() => {
    if (state.selectedRows.length === 0) {
      message.warning('Please select rows to delete');
      return;
    }

    state.selectedRows.forEach(row => {
      if (row.id) {
        dispatch({ type: 'MARK_FOR_DELETION', payload: row.id });
      }
    });
  }, [state.selectedRows]);

  // Handle save
  const handleSave = useCallback(() => {
    // Validation: all source parts should be the same
    const uniqueSourceParts = new Set(state.configs.map(config => config.sourcePart));
    if (uniqueSourceParts.size > 1) {
      message.error('All source parts must be the same');
      return;
    }

    const sourcePart = state.configs[0]?.sourcePart || '';

    const added = state.configs.filter(
      config => config.id && state.newRows.has(config.id) && !state.deletedRows.has(config.id)
    );

    const modified = state.configs.filter(
      config => config.id && state.modifiedRows.has(config.id) && !state.deletedRows.has(config.id)
    );

    const deleted = Array.from(state.deletedRows);

    const saveRequest: ConfigSaveRequest = {
      sourcePart,
      added,
      modified,
      deleted,
    };

    saveMutation.mutate(saveRequest);
  }, [state, saveMutation]);

  // Handle selection change
  const handleSelectionChange = useCallback((selectedRows: SourcePartConfig[]) => {
    dispatch({ type: 'SET_SELECTED_ROWS', payload: selectedRows });
  }, []);

  return {
    state,
    isLoading: state.isLoading || queryLoading,
    isSaving: saveMutation.isPending,
    handleSearch,
    handleEditToggle,
    handleRowUpdate,
    handleAddRow,
    handleDeleteRow,
    handleSave,
    handleSelectionChange,
  };
};
