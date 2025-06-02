// src/pages/ConfigOperation/hook.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useCallback, useReducer } from 'react';
import * as XLSX from 'xlsx';
import {
  ConfigApiResponse,
  ConfigOperationAction,
  ConfigOperationState,
  ConfigSaveRequest,
  QueryFormData,
  SourcePartConfig,
  ImportedRowData,
} from './types';

const initialState: ConfigOperationState = {
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
        // Don't reset changes when toggling edit mode
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

// Excel import/export utilities
const validateImportedRow = (row: ImportedRowData): SourcePartConfig | null => {
  // Check if row has required fields
  if (!row.sourcePart || !row.binGrade || !row.targetPart) {
    return null;
  }

  return {
    sourcePart: String(row.sourcePart).trim(),
    binGrade: String(row.binGrade).trim(),
    targetPart: String(row.targetPart).trim(),
    claimUser: row.claimUser ? String(row.claimUser).trim() : '',
    claimTime: row.claimTime ? String(row.claimTime).trim() : new Date().toISOString(),
  };
};

const downloadTemplate = () => {
  try {
    // Create sample template data
    const templateData = [
      {
        'Source Part': 'SAMPLE_SP001',
        'Bin Grade': 'A',
        'Target Part': 'SAMPLE_TP001',
        'Claim User': 'sample_user',
        'Claim Time': new Date().toISOString(),
      },
      {
        'Source Part': 'SAMPLE_SP001',
        'Bin Grade': 'B',
        'Target Part': 'SAMPLE_TP002',
        'Claim User': 'sample_user',
        'Claim Time': new Date().toISOString(),
      },
    ];
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Auto-size columns
    const colWidths = Object.keys(templateData[0]).map(key => ({
      wch: Math.max(key.length, 15) + 2
    }));
    worksheet['!cols'] = colWidths;
    
    // Save file
    XLSX.writeFile(workbook, 'config_import_template.xlsx');
    
    message.success('Template downloaded successfully');
  } catch (error) {
    message.error('Failed to download template');
    throw error;
  }
};

const processExcelFile = async (file: File): Promise<SourcePartConfig[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('No worksheets found in the file'));
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: ImportedRowData[] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }).slice(1) as any[]; // Skip header row
        
        // Convert array format to object format
        const headers = ['sourcePart', 'binGrade', 'targetPart', 'claimUser', 'claimTime'];
        const processedData: ImportedRowData[] = jsonData.map((row: any[]) => {
          const obj: ImportedRowData = {};
          headers.forEach((header, index) => {
            obj[header as keyof ImportedRowData] = row[index] || '';
          });
          return obj;
        });
        
        // Validate and filter valid rows
        const validConfigs = processedData
          .map(validateImportedRow)
          .filter((config): config is SourcePartConfig => config !== null);
        
        if (validConfigs.length === 0) {
          reject(new Error('No valid rows found in the Excel file. Please check the format.'));
          return;
        }
        
        resolve(validConfigs);
      } catch (error) {
        reject(new Error('Failed to parse Excel file. Please check the file format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const exportToExcel = (configs: SourcePartConfig[], filename: string = 'configs') => {
  try {
    // Prepare data for export (exclude internal id and format dates)
    const exportData = configs.map(config => ({
      'Source Part': config.sourcePart,
      'Bin Grade': config.binGrade,
      'Target Part': config.targetPart,
      'Claim User': config.claimUser,
      'Claim Time': config.claimTime ? new Date(config.claimTime).toLocaleString() : '',
    }));
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Configurations');
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => String(row[key as keyof typeof row]).length)
      ) + 2
    }));
    worksheet['!cols'] = colWidths;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, finalFilename);
    
    message.success(`Data exported to ${finalFilename}`);
  } catch (error) {
    message.error('Failed to export data to Excel');
    throw error;
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
    // Get configs excluding deleted ones
    const validConfigs = state.configs.filter(
      config => config.id && !state.deletedRows.has(config.id)
    );

    // Validation: all source parts should be the same
    const uniqueSourceParts = new Set(validConfigs.map(config => config.sourcePart));
    if (uniqueSourceParts.size > 1) {
      message.error('All source parts must be the same');
      return;
    }

    // Check for empty required fields
    const hasEmptyFields = validConfigs.some(
      config => !config.sourcePart.trim() || !config.binGrade.trim() || !config.targetPart.trim()
    );
    if (hasEmptyFields) {
      message.error('Please fill in all required fields (Source Part, Bin Grade, Target Part)');
      return;
    }

    const sourcePart = validConfigs[0]?.sourcePart || '';

    const saveRequest: ConfigSaveRequest = {
      sourcePart,
      configs: validConfigs,
    };

    saveMutation.mutate(saveRequest);
  }, [state, saveMutation]);

  // Handle selection change
  const handleSelectionChange = useCallback((selectedRows: SourcePartConfig[]) => {
    dispatch({ type: 'SET_SELECTED_ROWS', payload: selectedRows });
  }, []);

  // Handle discard changes
  const handleDiscard = useCallback(() => {
    dispatch({ type: 'DISCARD_CHANGES' });
    message.info('Changes discarded');
  }, []);

  // Handle Excel import
  const handleImport = useCallback(async (file: File) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const importedConfigs = await processExcelFile(file);
      
      // Validate source part consistency if there are existing configs
      if (state.configs.length > 0) {
        const currentSourcePart = state.configs[0]?.sourcePart;
        const importedSourceParts = new Set(importedConfigs.map(config => config.sourcePart));
        
        if (importedSourceParts.size > 1 || (currentSourcePart && !importedSourceParts.has(currentSourcePart))) {
          message.error('Imported data must have the same source part as existing data');
          return false;
        }
      }
      
      dispatch({ type: 'IMPORT_DATA', payload: importedConfigs });
      
      // Auto-enter edit mode if not already in edit mode
      if (!state.isEditing) {
        dispatch({ type: 'SET_EDITING', payload: true });
      }
      
      message.success(`Successfully imported ${importedConfigs.length} rows`);
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Import failed');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isEditing, state.configs]);

  // Handle Excel export
  const handleExport = useCallback(() => {
    const exportConfigs = state.configs.filter(
      config => config.id && !state.deletedRows.has(config.id)
    );
    
    if (exportConfigs.length === 0) {
      message.warning('No data to export');
      return;
    }

    try {
      const sourcePart = exportConfigs[0]?.sourcePart || 'configs';
      exportToExcel(exportConfigs, `${sourcePart}_configs`);
    } catch (error) {
      message.error('Export failed');
    }
  }, [state.configs, state.deletedRows]);

  // Handle template download
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadTemplate();
    } catch (error) {
      message.error('Failed to download template');
    }
  }, []);

  // Get row styling class
  const getRowClassName = useCallback((config: SourcePartConfig): string => {
    if (!config.id) return '';
    
    if (state.deletedRows.has(config.id)) return 'row-deleted';
    if (state.newRows.has(config.id)) return 'row-new'; 
    if (state.modifiedRows.has(config.id)) return 'row-modified';
    
    return '';
  }, [state.deletedRows, state.newRows, state.modifiedRows]);

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
    handleDiscard,
    handleImport,
    handleExport,
    handleDownloadTemplate,
    getRowClassName,
  };
};