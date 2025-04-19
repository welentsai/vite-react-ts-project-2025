import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

interface RowData {
  id: number;
  name: string;
  age: number;
  email: string;
  country: string;
  isActive: boolean;
}

export const CustomDataGrid: React.FC = () => {
  const [gridApi, setGridApi] = useState<any>(null);

  // Column Definitions
  const [columnDefs] = useState<ColDef[]>([
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 70 },
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    { field: 'age', headerName: 'Age', sortable: true, filter: true, width: 90 },
    { field: 'email', headerName: 'Email', sortable: true, filter: true },
    { field: 'country', headerName: 'Country', sortable: true, filter: true },
    {
      field: 'isActive',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        return params.value ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Inactive
          </span>
        );
      },
    },
  ]);

  // Sample data
  const [rowData] = useState<RowData[]>([
    { id: 1, name: 'John Doe', age: 28, email: 'john@example.com', country: 'USA', isActive: true },
    {
      id: 2,
      name: 'Jane Smith',
      age: 32,
      email: 'jane@example.com',
      country: 'Canada',
      isActive: false,
    },
    {
      id: 3,
      name: 'Bob Johnson',
      age: 45,
      email: 'bob@example.com',
      country: 'UK',
      isActive: true,
    },
    {
      id: 4,
      name: 'Sarah Williams',
      age: 29,
      email: 'sarah@example.com',
      country: 'Australia',
      isActive: true,
    },
    {
      id: 5,
      name: 'Michael Brown',
      age: 36,
      email: 'michael@example.com',
      country: 'Germany',
      isActive: false,
    },
    {
      id: 6,
      name: 'Emma Wilson',
      age: 41,
      email: 'emma@example.com',
      country: 'France',
      isActive: true,
    },
    {
      id: 7,
      name: 'James Taylor',
      age: 33,
      email: 'james@example.com',
      country: 'Spain',
      isActive: false,
    },
    {
      id: 8,
      name: 'David Miller',
      age: 27,
      email: 'david@example.com',
      country: 'Italy',
      isActive: true,
    },
  ]);

  // Default column configuration
  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Employee Data</h3>
          <p className="text-sm text-gray-500">Manage and view employee information</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCsv}
            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
          >
            Export to CSV
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
            Add New
          </button>
        </div>
      </div>

      <div className="ag-theme-alpine w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection={{ mode: 'multiRow', enableClickSelection: true }}
          pagination={true}
          paginationPageSize={20}
          onGridReady={onGridReady}
          rowHeight={45}
          headerHeight={48}
          suppressCellFocus={true}
        />
      </div>

      <div className="text-sm text-gray-500">Showing {rowData.length} records</div>
    </div>
  );
};
