import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, provideGlobalGridOptions, AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);
// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: "legacy"});


// Define the type for our row data
interface RowData {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
}

export const DataGrid: React.FC = () => {
  // Column Definitions: Defines the columns to be displayed in the grid
  const [columnDefs] = useState<ColDef[]>([
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80 },
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    { field: 'age', headerName: 'Age', sortable: true, filter: true, width: 100 },
    { field: 'email', headerName: 'Email', sortable: true, filter: true },
    { field: 'country', headerName: 'Country', sortable: true, filter: true },
  ]);

  // Sample data
  const [rowData] = useState<RowData[]>([
    { id: 1, name: 'John Doe', age: 28, email: 'john@example.com', country: 'USA' },
    { id: 2, name: 'Jane Smith', age: 32, email: 'jane@example.com', country: 'Canada' },
    { id: 3, name: 'Bob Johnson', age: 45, email: 'bob@example.com', country: 'UK' },
    { id: 4, name: 'Sarah Williams', age: 29, email: 'sarah@example.com', country: 'Australia' },
    { id: 5, name: 'Michael Brown', age: 36, email: 'michael@example.com', country: 'Germany' },
  ]);

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  return (
    <div className="ag-theme-alpine w-full h-[500px]">
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection={{mode: 'multiRow' }}
        pagination={true}
        paginationPageSize={20}
      />
    </div>
  );
};