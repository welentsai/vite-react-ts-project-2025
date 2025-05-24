import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';

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
        // Create worksheet data
        const wsData = [headers, ...sampleData];

        // If no sample data provided, add some empty rows
        if (sampleData.length === 0) {
          for (let i = 0; i < 5; i++) {
            wsData.push(new Array(headers.length).fill(''));
          }
        }

        console.log(sampleData);

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
        ws['!cols'] = colWidths;

        // Style the header row (limited styling in SheetJS Community Edition)
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
          if (ws[headerCell]) {
            ws[headerCell].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: '4472C4' } },
              alignment: { horizontal: 'center' },
            };
          }
        }

        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        // Set workbook properties
        wb.Props = {
          Title: 'Data Template',
          Subject: 'Excel Template',
          Author: 'Data Grid Application',
          CreatedDate: new Date(),
        };

        // Write and download file
        XLSX.writeFile(wb, filename);
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

        reader.onload = e => {
          try {
            const data = e.target?.result;
            if (!data) {
              throw new Error('Failed to read file content');
            }

            const workbook = XLSX.read(data, { type: 'array' });

            // Get the first worksheet
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
              throw new Error('No worksheet found in the Excel file');
            }

            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with header row as keys
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1, // Use first row as header
              defval: null, // Default value for empty cells
              blankrows: false, // Skip blank rows
            }) as unknown[][];

            if (jsonData.length === 0) {
              throw new Error('No data found in the Excel file');
            }

            // Extract headers and data
            const headers = jsonData[0] as string[];
            const dataRows = jsonData.slice(1);

            // Convert to object array
            const result: T[] = dataRows
              .filter(row => row.some(cell => cell !== null && cell !== '')) // Filter empty rows
              .map(row => {
                const obj: Record<string, unknown> = {};
                headers.forEach((header, index) => {
                  const processedValue = processCellValue(row[index]);
                  obj[header] = processedValue;
                });
                return obj as T;
              });

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
        // Prepare worksheet data
        const wsData = [headers, ...data];

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map((header, index) => {
          let maxLength = header.length;
          data.forEach(row => {
            const cellValue = row[index]?.toString() || '';
            maxLength = Math.max(maxLength, cellValue.length);
          });
          return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        ws['!cols'] = colWidths;

        // Basic styling for header (limited in community edition)
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
          if (ws[headerCell]) {
            ws[headerCell].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: '366092' } },
              alignment: { horizontal: 'center' },
            };
          }
        }

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        // Set workbook properties
        wb.Props = {
          Title: 'Exported Data',
          Subject: 'Data Export',
          Author: 'Data Grid Application',
          CreatedDate: new Date(),
        };

        // Write and download file
        XLSX.writeFile(wb, filename);
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
