// src/pages/ConfigOperation/useExcel.ts

import { useCallback } from 'react';
import { message } from 'antd';
import * as XLSX from 'xlsx';
import { SourcePartConfig, ImportedRowData } from './types';

// Excel utility functions
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

const createTemplateData = () => [
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

const createWorkbook = (data: any[], sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String(row[key as keyof typeof row] || '').length)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;
  
  return workbook;
};

const processExcelFile = (file: File): Promise<SourcePartConfig[]> => {
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
        
        // Try to read with headers first
        let jsonData: any[];
        try {
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        } catch (error) {
          reject(new Error('Failed to parse Excel file. Please check the file format.'));
          return;
        }
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row.'));
          return;
        }
        
        // Skip header row and convert array format to object format
        const dataRows = jsonData.slice(1) as any[];
        const headers = ['sourcePart', 'binGrade', 'targetPart', 'claimUser', 'claimTime'];
        
        const processedData: ImportedRowData[] = dataRows
          .filter(row => row.some((cell: any) => cell !== '')) // Filter out empty rows
          .map((row: any[]) => {
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
          reject(new Error('No valid rows found in the Excel file. Please check the format and ensure required fields (Source Part, Bin Grade, Target Part) are filled.'));
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

export const useExcel = () => {
  const downloadTemplate = useCallback(() => {
    try {
      const templateData = createTemplateData();
      const workbook = createWorkbook(templateData, 'Template');
      
      // Save file
      XLSX.writeFile(workbook, 'config_import_template.xlsx');
      message.success('Template downloaded successfully');
    } catch (error) {
      message.error('Failed to download template');
      throw error;
    }
  }, []);

  const exportToExcel = useCallback((
    configs: SourcePartConfig[], 
    filename: string = 'configs'
  ) => {
    try {
      if (configs.length === 0) {
        message.warning('No data to export');
        return;
      }

      // Prepare data for export (exclude internal id and format dates)
      const exportData = configs.map(config => ({
        'Source Part': config.sourcePart,
        'Bin Grade': config.binGrade,
        'Target Part': config.targetPart,
        'Claim User': config.claimUser,
        'Claim Time': config.claimTime ? new Date(config.claimTime).toLocaleString() : '',
      }));
      
      const workbook = createWorkbook(exportData, 'Configurations');
      
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
  }, []);

  const importFromExcel = useCallback(async (file: File): Promise<SourcePartConfig[]> => {
    try {
      const importedConfigs = await processExcelFile(file);
      message.success(`Successfully processed ${importedConfigs.length} rows from Excel file`);
      return importedConfigs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      message.error(errorMessage);
      throw error;
    }
  }, []);

  const validateImportConsistency = useCallback((
    existingConfigs: SourcePartConfig[],
    importedConfigs: SourcePartConfig[]
  ): { isValid: boolean; error?: string } => {
    // Validate source part consistency if there are existing configs
    if (existingConfigs.length > 0) {
      const currentSourcePart = existingConfigs[0]?.sourcePart;
      const importedSourceParts = new Set(importedConfigs.map(config => config.sourcePart));
      
      if (importedSourceParts.size > 1) {
        return {
          isValid: false,
          error: 'All imported rows must have the same source part'
        };
      }
      
      if (currentSourcePart && !importedSourceParts.has(currentSourcePart)) {
        return {
          isValid: false,
          error: 'Imported data must have the same source part as existing data'
        };
      }
    }
    
    return { isValid: true };
  }, []);

  return {
    downloadTemplate,
    exportToExcel,
    importFromExcel,
    validateImportConsistency,
  };
};