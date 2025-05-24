import {
  CellEditingStoppedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useRef, useState } from 'react';
import { useExcel } from './useExcel';

// Define the type for our row data

interface RowData {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
  deleted?: boolean; // Flag to mark rows as deleted
}

// Define the expected structure of imported Excel data
interface ImportedExcelRow {
  ID?: number;
  id?: number;
  Name?: string;
  name?: string;
  Age?: number | string;
  age?: number | string;
  Email?: string;
  email?: string;
  Country?: string;
  country?: string;
  [key: string]: unknown; // Allow for additional columns
}

// Type guard and helper functions
const isValidRowData = (row: unknown): row is ImportedExcelRow => {
  return typeof row === 'object' && row !== null;
};

const hasRequiredData = (row: ImportedExcelRow): boolean => {
  return Boolean(row.Name || row.name);
};

const safeParseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const safeParseString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value !== null && value !== undefined) return String(value);
  return '';
};

export const DataGridWithSheetJS: React.FC = () => {
  const gridApiRef = useRef<GridApi | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use the custom SheetJS operations hook
  const { downloadTemplate, parseExcel, exportData, isLoading, error } =
    useExcel<ImportedExcelRow>();

  // Column Definitions: Defines the columns to be displayed in the grid
  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      editable: false, // ID is not editable
    },
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      editable: true,
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      filter: true,
      width: 100,
      editable: true,
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      editable: true,
    },
    {
      field: 'country',
      headerName: 'Country',
      sortable: true,
      filter: true,
      editable: true,
    },
    {
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<RowData>) => {
        // Early return if no data
        if (!params.data) {
          return null;
        }

        const data = params.data;
        return (
          <div className="flex gap-2">
            {!data.deleted ? (
              <button
                onClick={() => handleSoftDeleteRow(data.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => handleRecoverRow(data.id)}
                className="text-green-600 hover:text-green-800"
              >
                Recover
              </button>
            )}
          </div>
        );
      },
    },
  ]);

  // Sample data
  const [rowData, setRowData] = useState<RowData[]>([]);

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  // Form state for adding new rows
  const [newRow, setNewRow] = useState<Omit<RowData, 'id'>>({
    name: '',
    age: 0,
    email: '',
    country: '',
  });

  // Handle grid ready event to get access to the grid API
  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRow(prev => ({
      ...prev,
      [name]: name === 'age' ? Number(value) : value,
    }));
  };

  // Add a new row
  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();

    // Get the next available ID (max ID + 1)
    const nextId = Math.max(...rowData.map(row => row.id), 0) + 1;

    // Create the new row with the generated ID
    const rowToAdd: RowData = {
      id: nextId,
      ...newRow,
    };

    // Update the state with the new row
    setRowData(prevData => [...prevData, rowToAdd]);

    // Clear the form
    setNewRow({
      name: '',
      age: 0,
      email: '',
      country: '',
    });
  };

  // Edit a row (triggered when cell editing stops)
  const handleCellEditingStopped = (event: CellEditingStoppedEvent) => {
    const updatedRow = event.data;

    // Find and update the row in our state
    setRowData(prevData => prevData.map(row => (row.id === updatedRow.id ? updatedRow : row)));
  };

  // Soft delete a row (mark as deleted)
  const handleSoftDeleteRow = (id: number) => {
    setRowData(prevData => prevData.map(row => (row.id === id ? { ...row, deleted: true } : row)));
  };

  // Recover a soft-deleted row
  const handleRecoverRow = (id: number) => {
    setRowData(prevData => prevData.map(row => (row.id === id ? { ...row, deleted: false } : row)));
  };

  // Save (console log) rows that are not deleted
  const handleSave = () => {
    const activeRows = rowData.filter(row => !row.deleted);
    console.log('Active rows:', activeRows);
  };

  // SheetJS Excel Operations
  const handleDownloadTemplate = async () => {
    const templateHeaders = ['ID', 'Name', 'Age', 'Email', 'Country'];
    const sampleData = [
      [1, 'Sample Name', 25, 'sample@email.com', 'Sample Country'],
      [2, '', '', '', ''],
      [3, '', '', '', ''],
    ];

    await downloadTemplate(templateHeaders, sampleData, 'data-template.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportExcel(file);
    }
  };

  const handleImportExcel = async (file: File) => {
    try {
      const importedData = await parseExcel(file);

      // Transform imported data to match our RowData interface
      const transformedData: RowData[] = importedData
        .filter(isValidRowData)
        .filter(hasRequiredData)
        .map((row: ImportedExcelRow, index: number) => ({
          id: row.ID || row.id || Math.max(...rowData.map(r => r.id), 0) + index + 1,
          name: safeParseString(row.Name || row.name),
          age: safeParseNumber(row.Age || row.age),
          email: safeParseString(row.Email || row.email),
          country: safeParseString(row.Country || row.country),
        }));

      // Add imported data to existing data
      setRowData([...transformedData]);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log(`Imported ${transformedData.length} rows from Excel file`);
    } catch (err) {
      console.error('Error importing Excel file:', err);
    }
  };

  const handleExportData = async () => {
    const activeRows = rowData.filter(row => !row.deleted);
    const headers = ['ID', 'Name', 'Age', 'Email', 'Country'];
    const exportedData = activeRows.map(row => [row.id, row.name, row.age, row.email, row.country]);

    await exportData(headers, exportedData, 'exported-data.xlsx');
  };

  // Simple CSV export as alternative (using SheetJS)
  const handleExportCSV = () => {
    const activeRows = rowData.filter(row => !row.deleted);
    const headers = ['ID', 'Name', 'Age', 'Email', 'Country'];
    const csvData = [
      headers,
      ...activeRows.map(row => [row.id, row.name, row.age, row.email, row.country]),
    ];

    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported-data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add CSS for deleted row styling
  React.useEffect(() => {
    // Add a CSS rule for deleted rows
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        .deleted-row {
          color: #9ca3af; /* Gray text */
          background-color: #f3f4f6; /* Light gray background */
          text-decoration: line-through;
          opacity: 0.7;
        }
        .deleted-row .ag-cell {
          color: #9ca3af !important;
        }
      `;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* SheetJS Excel Operations Section */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-4">Excel Operations (SheetJS)</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleDownloadTemplate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            Download Template
          </button>

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            <button
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              Import Excel
            </button>
          </div>

          <button
            onClick={handleExportData}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            Export Excel
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
          >
            Export CSV
          </button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <p>
            <strong>Template:</strong> Download a formatted Excel template with sample data
          </p>
          <p>
            <strong>Import:</strong> Upload Excel files (.xlsx/.xls) to add data to the grid
          </p>
          <p>
            <strong>Export:</strong> Download current data as Excel or CSV format
          </p>
        </div>
      </div>

      {/* Add New Record Form */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-medium mb-4">Add New Record</h2>
        <form
          onSubmit={handleAddRow}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={newRow.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              name="age"
              value={newRow.age}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={newRow.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              name="country"
              value={newRow.country}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Add Row
            </button>
          </div>
        </form>
      </div>

      {/* Data Grid */}
      <div className="ag-theme-alpine w-full h-[500px]">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection={{ mode: 'multiRow' }}
          pagination={true}
          paginationPageSize={20}
          onGridReady={onGridReady}
          onCellEditingStopped={handleCellEditingStopped}
          editType="fullRow"
          getRowClass={params => {
            return params.data.deleted ? 'deleted-row' : '';
          }}
        />
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <p>
            Double-click on any cell to edit its value. Click Delete to mark a row as deleted (will
            turn gray). Use Excel operations above to import/export data.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
