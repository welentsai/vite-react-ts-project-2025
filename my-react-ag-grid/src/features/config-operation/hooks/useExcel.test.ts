import { message } from 'antd';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SourcePartConfig } from './types';
import {
  downloadTemplate,
  exportToExcel,
  importFromExcel,
  validateImportConsistency,
} from './useExcel';

// Mock antd message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));
const mockedAxios = vi.mocked(axios, true);

// Mock ExcelJS
const mockWorksheet = {
  addRow: vi.fn(),
  getRow: vi.fn(() => ({
    eachCell: vi.fn((callback: (cell: { font: object; fill: object }, index: number) => void) => {
      callback({ font: {}, fill: {} }, 1);
    }),
  })),
  getColumn: vi.fn(() => ({ width: 0 })),
  eachRow: vi.fn(),
};

const mockWorkbook = {
  creator: '',
  created: new Date(),
  modified: new Date(),
  addWorksheet: vi.fn(() => mockWorksheet),
  xlsx: {
    writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
    load: vi.fn(() => Promise.resolve()),
  },
  worksheets: [mockWorksheet],
};

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn(() => mockWorkbook),
  },
}));

// Mock DOM APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document.createElement
const mockClick = vi.fn();
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
  })),
});

// Mock FileReader
class MockFileReader {
  onload: ((event: { target: { result: ArrayBuffer | null } }) => void) | null = null;
  onerror: (() => void) | null = null;
  result: ArrayBuffer | null = null;

  readAsArrayBuffer() {
    // Simulate successful file read
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: MockFileReader,
});

describe('Excel Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockWorksheet.addRow.mockClear();
    mockWorksheet.getRow.mockClear();
    mockWorksheet.getColumn.mockClear();
    mockWorksheet.eachRow.mockClear();
    mockWorkbook.addWorksheet.mockClear();
    mockWorkbook.xlsx.writeBuffer.mockClear();
    mockWorkbook.xlsx.load.mockClear();

    // Reset mock return values
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));
    mockWorkbook.xlsx.load.mockResolvedValue(undefined);
    mockWorkbook.worksheets = [mockWorksheet];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadTemplate', () => {
    const mockBlob = new Blob(['mock-excel-data'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({
        data: mockBlob,
        status: 200,
        statusText: 'OK',
      });
    });

    test('should successfully download template from public/templates directory using axios', async () => {
      await downloadTemplate();

      expect(mockedAxios.get).toHaveBeenCalledWith('/templates/config_import_template.xlsx', {
        responseType: 'blob',
      });
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith('Template downloaded successfully');
    });

    test('should handle axios error with 404 status', async () => {
      const axiosError = {
        response: {
          status: 404,
          statusText: 'Not Found',
        },
        message: 'Request failed with status code 404',
      };
      mockedAxios.get.mockRejectedValue(axiosError);

      await expect(downloadTemplate()).rejects.toEqual(axiosError);
      expect(message.error).toHaveBeenCalledWith('Failed to download template');
    });

    test('should handle axios error with 500 status', async () => {
      const axiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
        message: 'Request failed with status code 500',
      };
      mockedAxios.get.mockRejectedValue(axiosError);

      await expect(downloadTemplate()).rejects.toEqual(axiosError);
      expect(message.error).toHaveBeenCalledWith('Failed to download template');
    });

    test('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(downloadTemplate()).rejects.toThrow('Network error');
      expect(message.error).toHaveBeenCalledWith('Failed to download template');
    });

    test('should handle timeout error', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };
      mockedAxios.get.mockRejectedValue(timeoutError);

      await expect(downloadTemplate()).rejects.toEqual(timeoutError);
      expect(message.error).toHaveBeenCalledWith('Failed to download template');
    });

    test('should set correct download filename', async () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      };

      (document.createElement as ReturnType<typeof vi.fn>).mockReturnValue(mockAnchor);

      await downloadTemplate();

      expect(mockAnchor.download).toBe('config_import_template.xlsx');
    });

    test('should clean up URL after download', async () => {
      const mockUrl = 'mock-blob-url';
      (window.URL.createObjectURL as ReturnType<typeof vi.fn>).mockReturnValue(mockUrl);

      await downloadTemplate();

      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    test('should use correct axios configuration', async () => {
      await downloadTemplate();

      expect(mockedAxios.get).toHaveBeenCalledWith('/templates/config_import_template.xlsx', {
        responseType: 'blob',
      });
    });
  });

  describe('exportToExcel', () => {
    const mockConfigs: SourcePartConfig[] = [
      {
        id: '1',
        sourcePart: 'SP001',
        binGrade: 'A',
        targetPart: 'TP001',
        claimUser: 'user1',
        claimTime: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        sourcePart: 'SP002',
        binGrade: 'B',
        targetPart: 'TP002',
        claimUser: 'user2',
        claimTime: '2023-01-02T00:00:00.000Z',
      },
    ];

    test('should successfully export configs to Excel', async () => {
      await exportToExcel(mockConfigs, 'test_export');

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Configurations');
      expect(mockWorksheet.addRow).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith(expect.stringContaining('test_export_'));
    });

    test('should use default filename when not provided', async () => {
      await exportToExcel(mockConfigs);

      expect(message.success).toHaveBeenCalledWith(expect.stringContaining('configs_'));
    });

    test('should show warning for empty configs', async () => {
      await exportToExcel([]);

      expect(message.warning).toHaveBeenCalledWith('No data to export');
      expect(mockWorkbook.xlsx.writeBuffer).not.toHaveBeenCalled();
    });

    test('should handle export error', async () => {
      mockWorkbook.xlsx.writeBuffer.mockRejectedValue(new Error('Export failed'));

      await expect(exportToExcel(mockConfigs)).rejects.toThrow('Export failed');
      expect(message.error).toHaveBeenCalledWith('Failed to export data to Excel');
    });

    test('should format export data correctly', async () => {
      await exportToExcel(mockConfigs);

      // Verify addRow was called with headers and formatted data
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(3); // 1 header + 2 data rows

      // Check that data was formatted correctly (excluding id field)
      const addRowCalls = mockWorksheet.addRow.mock.calls;
      expect(addRowCalls[0][0]).toEqual([
        'Source Part',
        'Bin Grade',
        'Target Part',
        'Claim User',
        'Claim Time',
      ]);
    });

    test('should generate filename with timestamp', async () => {
      await exportToExcel(mockConfigs, 'custom_name');

      const successMessage = (message.success as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(successMessage).toMatch(/custom_name_\d{4}-\d{2}-\d{2}\.xlsx/);
    });
  });

  describe('importFromExcel', () => {
    test('should successfully import valid Excel file', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Mock worksheet data
      mockWorksheet.eachRow.mockImplementation(
        (
          callback: (
            row: {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => void;
            },
            rowNumber: number
          ) => void
        ) => {
          // Header row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'Source Part' }, 1);
                cellCallback({ value: 'Bin Grade' }, 2);
                cellCallback({ value: 'Target Part' }, 3);
                cellCallback({ value: 'Claim User' }, 4);
                cellCallback({ value: 'Claim Time' }, 5);
              },
            },
            1
          );

          // Data row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'SP001' }, 1);
                cellCallback({ value: 'A' }, 2);
                cellCallback({ value: 'TP001' }, 3);
                cellCallback({ value: 'user1' }, 4);
                cellCallback({ value: '2023-01-01' }, 5);
              },
            },
            2
          );
        }
      );

      const importedConfigs = await importFromExcel(mockFile);

      expect(importedConfigs).toHaveLength(1);
      expect(importedConfigs[0]).toEqual({
        sourcePart: 'SP001',
        binGrade: 'A',
        targetPart: 'TP001',
        claimUser: 'user1',
        claimTime: '2023-01-01',
      });

      expect(mockWorkbook.xlsx.load).toHaveBeenCalled();
      expect(message.success).toHaveBeenCalledWith('Successfully processed 1 rows from Excel file');
    });

    test('should handle file with no worksheets', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      mockWorkbook.worksheets = [];

      await expect(importFromExcel(mockFile)).rejects.toThrow('No worksheets found in the file');
      expect(message.error).toHaveBeenCalledWith('No worksheets found in the file');
    });

    test('should handle file with insufficient data', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      mockWorksheet.eachRow.mockImplementation(
        (
          callback: (
            row: {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => void;
            },
            rowNumber: number
          ) => void
        ) => {
          // Only header row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'Source Part' }, 1);
              },
            },
            1
          );
        }
      );

      await expect(importFromExcel(mockFile)).rejects.toThrow(
        'Excel file must contain at least a header row and one data row.'
      );
      expect(message.error).toHaveBeenCalledWith(
        'Excel file must contain at least a header row and one data row.'
      );
    });

    test('should handle file with no valid rows', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      mockWorksheet.eachRow.mockImplementation(
        (
          callback: (
            row: {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => void;
            },
            rowNumber: number
          ) => void
        ) => {
          // Header row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'Source Part' }, 1);
              },
            },
            1
          );

          // Invalid data row (missing required fields)
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: '' }, 1);
                cellCallback({ value: '' }, 2);
                cellCallback({ value: '' }, 3);
              },
            },
            2
          );
        }
      );

      await expect(importFromExcel(mockFile)).rejects.toThrow(
        'No valid rows found in the Excel file'
      );
      expect(message.error).toHaveBeenCalledWith(
        'No valid rows found in the Excel file. Please check the format and ensure required fields (Source Part, Bin Grade, Target Part) are filled.'
      );
    });

    test('should handle Excel parsing error', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      mockWorkbook.xlsx.load.mockRejectedValue(new Error('Parse error'));

      await expect(importFromExcel(mockFile)).rejects.toThrow('Failed to parse Excel file');
      expect(message.error).toHaveBeenCalledWith(
        'Failed to parse Excel file. Please check the file format.'
      );
    });

    test('should handle null/undefined values in imported data', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      mockWorksheet.eachRow.mockImplementation(
        (
          callback: (
            row: {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => void;
            },
            rowNumber: number
          ) => void
        ) => {
          // Header row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'Source Part' }, 1);
                cellCallback({ value: 'Bin Grade' }, 2);
                cellCallback({ value: 'Target Part' }, 3);
                cellCallback({ value: 'Claim User' }, 4);
                cellCallback({ value: 'Claim Time' }, 5);
              },
            },
            1
          );

          // Data row with null/undefined values
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'SP001' }, 1);
                cellCallback({ value: 'A' }, 2);
                cellCallback({ value: 'TP001' }, 3);
                cellCallback({ value: null }, 4);
                cellCallback({ value: undefined }, 5);
              },
            },
            2
          );
        }
      );

      const importedConfigs = await importFromExcel(mockFile);

      expect(importedConfigs).toHaveLength(1);
      expect(importedConfigs[0].claimUser).toBe('');
      expect(importedConfigs[0].claimTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO string format
    });

    test('should filter out completely empty rows', async () => {
      const mockFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      mockWorksheet.eachRow.mockImplementation(
        (
          callback: (
            row: {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => void;
            },
            rowNumber: number
          ) => void
        ) => {
          // Header row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'Source Part' }, 1);
              },
            },
            1
          );

          // Valid data row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: 'SP001' }, 1);
                cellCallback({ value: 'A' }, 2);
                cellCallback({ value: 'TP001' }, 3);
              },
            },
            2
          );

          // Empty row
          callback(
            {
              eachCell: (cellCallback: (cell: { value: unknown }, index: number) => void) => {
                cellCallback({ value: null }, 1);
                cellCallback({ value: '' }, 2);
                cellCallback({ value: undefined }, 3);
              },
            },
            3
          );
        }
      );

      const importedConfigs = await importFromExcel(mockFile);

      expect(importedConfigs).toHaveLength(1);
      expect(importedConfigs[0].sourcePart).toBe('SP001');
    });
  });

  describe('validateImportConsistency', () => {
    const existingConfigs: SourcePartConfig[] = [
      {
        id: '1',
        sourcePart: 'SP001',
        binGrade: 'A',
        targetPart: 'TP001',
        claimUser: 'user1',
        claimTime: '2023-01-01',
      },
    ];

    test('should validate consistent source parts', () => {
      const importedConfigs: SourcePartConfig[] = [
        {
          sourcePart: 'SP001',
          binGrade: 'B',
          targetPart: 'TP002',
          claimUser: 'user2',
          claimTime: '2023-01-02',
        },
      ];

      const validation = validateImportConsistency(existingConfigs, importedConfigs);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('should reject multiple source parts in import', () => {
      const importedConfigs: SourcePartConfig[] = [
        {
          sourcePart: 'SP001',
          binGrade: 'A',
          targetPart: 'TP001',
          claimUser: 'user1',
          claimTime: '2023-01-01',
        },
        {
          sourcePart: 'SP002',
          binGrade: 'B',
          targetPart: 'TP002',
          claimUser: 'user2',
          claimTime: '2023-01-02',
        },
      ];

      const validation = validateImportConsistency(existingConfigs, importedConfigs);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('All imported rows must have the same source part');
    });

    test('should reject inconsistent source part with existing data', () => {
      const importedConfigs: SourcePartConfig[] = [
        {
          sourcePart: 'SP999',
          binGrade: 'A',
          targetPart: 'TP001',
          claimUser: 'user1',
          claimTime: '2023-01-01',
        },
      ];

      const validation = validateImportConsistency(existingConfigs, importedConfigs);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe(
        'Imported data must have the same source part as existing data'
      );
    });

    test('should validate when no existing configs', () => {
      const importedConfigs: SourcePartConfig[] = [
        {
          sourcePart: 'SP001',
          binGrade: 'A',
          targetPart: 'TP001',
          claimUser: 'user1',
          claimTime: '2023-01-01',
        },
      ];

      const validation = validateImportConsistency([], importedConfigs);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('should validate multiple imported configs with same source part', () => {
      const importedConfigs: SourcePartConfig[] = [
        {
          sourcePart: 'SP001',
          binGrade: 'A',
          targetPart: 'TP001',
          claimUser: 'user1',
          claimTime: '2023-01-01',
        },
        {
          sourcePart: 'SP001',
          binGrade: 'B',
          targetPart: 'TP002',
          claimUser: 'user2',
          claimTime: '2023-01-02',
        },
      ];

      const validation = validateImportConsistency([], importedConfigs);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
  });
});
