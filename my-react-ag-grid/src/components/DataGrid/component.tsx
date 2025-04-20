import {
  AllCommunityModule,
  CellEditingStoppedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  provideGlobalGridOptions,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useRef, useState } from 'react';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);
// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: 'legacy' });

// Define the type for our row data
interface RowData {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
  deleted?: boolean; // Flag to mark rows as deleted
}

export const DataGrid: React.FC = () => {
  const gridApiRef = useRef<GridApi | null>(null);

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
      cellRenderer: (params: any) => {
        return (
          <div className="flex gap-2">
            {!params.data.deleted ? (
              <button
                onClick={() => handleSoftDeleteRow(params.data.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => handleRecoverRow(params.data.id)}
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
  const [rowData, setRowData] = useState<RowData[]>([
    {
      id: 1,
      name: 'John Doe',
      age: 28,
      email: 'john@example.com',
      country: 'USA',
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 32,
      email: 'jane@example.com',
      country: 'Canada',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      age: 45,
      email: 'bob@example.com',
      country: 'UK',
    },
    {
      id: 4,
      name: 'Sarah Williams',
      age: 29,
      email: 'sarah@example.com',
      country: 'Australia',
    },
    {
      id: 5,
      name: 'Michael Brown',
      age: 36,
      email: 'michael@example.com',
      country: 'Germany',
    },
  ]);

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

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <p>
            Double-click on any cell to edit its value. Click Delete to mark a row as deleted (will
            turn gray).
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
