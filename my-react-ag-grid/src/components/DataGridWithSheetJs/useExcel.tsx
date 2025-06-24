import ExcelJS from 'exceljs';
import { useCallback, useState } from 'react';

// Define specific types instead of using 'any'
type CellValue = string | number | boolean | null | undefined;
type SheetRow = CellValue[];
type SheetData = SheetRow[];
// Default type for unknown data structures
type ExcelData = Record<string, unknown>;

// Helper function to process cell values
const processCellValue = (value: unknown): string | number | null => {
  // Handle different data types
  if (value !== null && value !== undefined && value !== '') {
    // Convert string numbers to actual numbers
    if (typeof value === 'string' && !isNaN(Number(value))) {
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        return numValue;
      }
    }
    // Return string values as-is
    return typeof value === 'string' || typeof value === 'number' ? value : String(value);
  }
  return null;
};

interface UseExcelReturn<T = ExcelData> {
  downloadTemplate: (headers: string[], sampleData?: SheetData, filename?: string) => Promise<void>;
  parseExcel: (file: File) => Promise<T[]>;
  exportData: (headers: string[], data: SheetData, filename?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useExcel = <T = ExcelData,>(): UseExcelReturn<T> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = useCallback(
    async (headers: string[], sampleData: SheetRow[] = [], filename: string = 'template.xlsx') => {
      setIsLoading(true);
      setError(null);

      try {
        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Data Grid Application';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Add a worksheet
        const worksheet = workbook.addWorksheet('Template');

        // Add header row
        worksheet.addRow(headers);

        // Add sample data rows
        if (sampleData.length > 0) {
          sampleData.forEach(row => {
            worksheet.addRow(row);
          });
        } else {
          // If no sample data provided, add some empty rows
          for (let i = 0; i < 5; i++) {
            worksheet.addRow(new Array(headers.length).fill(''));
          }
        }

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' },
          };
          cell.alignment = { horizontal: 'center' };
        });

        // Set column widths
        headers.forEach((header, i) => {
          const col = worksheet.getColumn(i + 1);
          col.width = Math.max(header.length + 2, 15);
        });

        // Write to buffer and create download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);

        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
        setError(errorMessage);
        console.error('Template creation error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const parseExcel = useCallback(async (file: File): Promise<T[]> => {
    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        // Validate file input
        if (!file) {
          setIsLoading(false);
          reject(new Error('No file provided'));
          return;
        }

        // Check file type
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv', // .csv
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
          setIsLoading(false);
          reject(new Error('Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files.'));
          return;
        }

        const reader = new FileReader();

        reader.onload = async e => {
          try {
            const data = e.target?.result;
            if (!data) {
              throw new Error('Failed to read file content');
            }

            const workbook = new ExcelJS.Workbook();

            // Load from buffer
            await workbook.xlsx.load(data as ArrayBuffer);

            // Get the first worksheet
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
              throw new Error('No worksheet found in the Excel file');
            }

            // Extract headers from first row
            const headers: string[] = [];
            worksheet.getRow(1).eachCell(cell => {
              headers.push(cell.value?.toString() || '');
            });

            if (headers.length === 0) {
              throw new Error('No headers found in the Excel file');
            }

            // Extract data rows
            const result: T[] = [];

            worksheet.eachRow((row, rowNumber) => {
              // Skip header row
              if (rowNumber === 1) return;

              // Check if row has any non-empty cells
              let hasData = false;
              const obj: Record<string, unknown> = {};

              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  const value = cell.value;
                  const processedValue = processCellValue(value);
                  obj[header] = processedValue;

                  if (processedValue !== null) {
                    hasData = true;
                  }
                }
              });

              // Only add rows with data
              if (hasData) {
                result.push(obj as T);
              }
            });

            if (result.length === 0) {
              throw new Error('No data found in the Excel file');
            }

            resolve(result);
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse Excel file';
      setError(errorMessage);
      console.error('Excel parsing error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportData = useCallback(
    async (headers: string[], data: unknown[][], filename: string = 'exported-data.xlsx') => {
      setIsLoading(true);
      setError(null);

      try {
        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Data Grid Application';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Add a worksheet
        const worksheet = workbook.addWorksheet('Data');

        // Add header row
        worksheet.addRow(headers);

        // Add data rows
        data.forEach(row => {
          worksheet.addRow(row);
        });

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF366092' },
          };
          cell.alignment = { horizontal: 'center' };
        });

        // Set column widths based on content
        headers.forEach((header, i) => {
          let maxLength = header.length;

          // Check data length in each column
          data.forEach(row => {
            const cellValue = row[i]?.toString() || '';
            maxLength = Math.max(maxLength, cellValue.length);
          });

          const col = worksheet.getColumn(i + 1);
          col.width = Math.min(Math.max(maxLength + 2, 10), 50);
        });

        // Write to buffer and create download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);

        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
        setError(errorMessage);
        console.error('Export error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    downloadTemplate,
    parseExcel,
    exportData,
    isLoading,
    error,
  };
};
