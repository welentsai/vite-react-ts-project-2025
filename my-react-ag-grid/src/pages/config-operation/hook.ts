// src/pages/ConfigOperation/hook.ts

import { useCallback, useReducer } from 'react';
import { message } from 'antd';
import { 
  configOperationReducer, 
  initialState, 
  getValidConfigs, 
  getExportableConfigs, 
  hasUnsavedChanges,
  getRowClassName 
} from './configReducer';
import { useConfigs } from './useConfigs';
import { useExcel } from './useExcel';
import { SourcePartConfig, QueryFormData } from './types';

export const useConfigOperation = () => {
  const [state, dispatch] = useReducer(configOperationReducer, initialState);
  
  // API operations hook
  const {
    fetchConfigsBySourcePart,
    saveConfigurations,
    isSaving,
    refetchConfigs,
  } = useConfigs();
  
  // Excel operations hook
  const {
    downloadTemplate,
    exportToExcel,
    importFromExcel,
    validateImportConsistency,
  } = useExcel();

  // Search/Query operations
  const handleSearch = useCallback(async (formData: QueryFormData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const configs = await fetchConfigsBySourcePart(formData);
      dispatch({ type: 'SET_CONFIGS', payload: configs });
      dispatch({ type: 'SET_EDITING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch configurations';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      message.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [fetchConfigsBySourcePart]);

  // Edit mode management
  const handleEditToggle = useCallback(() => {
    dispatch({ type: 'SET_EDITING', payload: !state.isEditing });
  }, [state.isEditing]);

  // Row operations
  const handleRowUpdate = useCallback((id: string, data: SourcePartConfig) => {
    dispatch({ type: 'UPDATE_ROW', payload: { id, data } });
  }, []);

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

  // Selection management
  const handleSelectionChange = useCallback((selectedRows: SourcePartConfig[]) => {
    dispatch({ type: 'SET_SELECTED_ROWS', payload: selectedRows });
  }, []);

  // Save operation
  const handleSave = useCallback(async () => {
    const validConfigs = getValidConfigs(state);

    try {
      await saveConfigurations(validConfigs);
      dispatch({ type: 'RESET_CHANGES' });
      dispatch({ type: 'SET_EDITING', payload: false });
      
      // Refetch data to ensure consistency
      const currentSourcePart = validConfigs[0]?.sourcePart;
      if (currentSourcePart) {
        await handleSearch({ sourcePart: currentSourcePart });
      }
    } catch (error) {
      // Error handling is done in useConfigs hook
      console.error('Save operation failed:', error);
    }
  }, [state, saveConfigurations, handleSearch]);

  // Discard changes
  const handleDiscard = useCallback(() => {
    dispatch({ type: 'DISCARD_CHANGES' });
    message.info('Changes discarded');
  }, []);

  // Excel import operation
  const handleImport = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Import data from Excel
      const importedConfigs = await importFromExcel(file);
      
      // Validate consistency with existing data
      const validation = validateImportConsistency(state.configs, importedConfigs);
      if (!validation.isValid) {
        message.error(validation.error!);
        return false;
      }
      
      // Import the data
      dispatch({ type: 'IMPORT_DATA', payload: importedConfigs });
      
      // Auto-enter edit mode if not already in edit mode
      if (!state.isEditing) {
        dispatch({ type: 'SET_EDITING', payload: true });
      }
      
      return false; // Prevent default upload behavior
    } catch (error) {
      // Error handling is done in useExcel hook
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.configs, state.isEditing, importFromExcel, validateImportConsistency]);

  // Excel export operation
  const handleExport = useCallback(() => {
    const exportConfigs = getExportableConfigs(state);
    
    if (exportConfigs.length === 0) {
      message.warning('No data to export');
      return;
    }

    try {
      const sourcePart = exportConfigs[0]?.sourcePart || 'configs';
      exportToExcel(exportConfigs, `${sourcePart}_configs`);
    } catch (error) {
      // Error handling is done in useExcel hook
      console.error('Export operation failed:', error);
    }
  }, [state, exportToExcel]);

  // Template download
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadTemplate();
    } catch (error) {
      // Error handling is done in useExcel hook
      console.error('Template download failed:', error);
    }
  }, [downloadTemplate]);

  // Row styling helper
  const getRowClassNameForConfig = useCallback((config: SourcePartConfig): string => {
    return getRowClassName(config, state);
  }, [state]);

  // Computed properties
  const computedState = {
    ...state,
    hasUnsavedChanges: hasUnsavedChanges(state),
    validConfigs: getValidConfigs(state),
    exportableConfigs: getExportableConfigs(state),
  };

  return {
    // State
    state: computedState,
    isLoading: state.isLoading,
    isSaving,
    
    // Search operations
    handleSearch,
    
    // Edit mode operations
    handleEditToggle,
    
    // Row operations
    handleRowUpdate,
    handleAddRow,
    handleDeleteRow,
    handleSelectionChange,
    
    // Save/Discard operations
    handleSave,
    handleDiscard,
    
    // Excel operations
    handleImport,
    handleExport,
    handleDownloadTemplate,
    
    // Utility functions
    getRowClassName: getRowClassNameForConfig,
  };
};