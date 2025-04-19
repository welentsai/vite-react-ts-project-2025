// src/components/CustomGroupingGrid.tsx
import {
  AllCommunityModule,
  ColDef,
  GridReadyEvent,
  ModuleRegistry,
  provideGlobalGridOptions,
  RowClassParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);
// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: 'legacy' });

// Define the type for our row data
interface SalesData {
  id: number;
  country: string;
  year: number;
  quarter: string;
  product: string;
  sales: number;
  profit: number;
  units: number;
  // Add fields for display control
  isGroupRow?: boolean;
  groupLevel?: number;
  expanded?: boolean;
  parentId?: string;
  groupId?: string;
  childCount?: number;
  groupValue?: string;
  groupField?: string;
}

// Type for group definition
interface GroupDefinition {
  field: string;
  displayName: string;
}

export const CustomGroupingGrid: React.FC = () => {
  const [gridApi, setGridApi] = useState<any>(null);
  const [rowData, setRowData] = useState<SalesData[]>([]);
  const [groupBy, setGroupBy] = useState<GroupDefinition[]>([]);
  const [groupedData, setGroupedData] = useState<SalesData[]>([]);

  console.log(gridApi);

  // Original unmodified data
  const originalData = useMemo<SalesData[]>(
    () => [
      {
        id: 1,
        country: 'USA',
        year: 2022,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 45000,
        profit: 15000,
        units: 30,
      },
      {
        id: 2,
        country: 'USA',
        year: 2022,
        quarter: 'Q1',
        product: 'Phone',
        sales: 35000,
        profit: 12000,
        units: 50,
      },
      {
        id: 3,
        country: 'USA',
        year: 2022,
        quarter: 'Q2',
        product: 'Laptop',
        sales: 50000,
        profit: 18000,
        units: 35,
      },
      {
        id: 4,
        country: 'USA',
        year: 2022,
        quarter: 'Q2',
        product: 'Phone',
        sales: 38000,
        profit: 13000,
        units: 55,
      },
      {
        id: 5,
        country: 'USA',
        year: 2023,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 55000,
        profit: 20000,
        units: 40,
      },
      {
        id: 6,
        country: 'USA',
        year: 2023,
        quarter: 'Q1',
        product: 'Phone',
        sales: 40000,
        profit: 15000,
        units: 60,
      },
      {
        id: 7,
        country: 'Canada',
        year: 2022,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 30000,
        profit: 10000,
        units: 20,
      },
      {
        id: 8,
        country: 'Canada',
        year: 2022,
        quarter: 'Q1',
        product: 'Phone',
        sales: 25000,
        profit: 8000,
        units: 40,
      },
      {
        id: 9,
        country: 'Canada',
        year: 2022,
        quarter: 'Q2',
        product: 'Laptop',
        sales: 32000,
        profit: 11000,
        units: 22,
      },
      {
        id: 10,
        country: 'Canada',
        year: 2022,
        quarter: 'Q2',
        product: 'Phone',
        sales: 28000,
        profit: 9000,
        units: 45,
      },
      {
        id: 11,
        country: 'Canada',
        year: 2023,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 35000,
        profit: 12000,
        units: 25,
      },
      {
        id: 12,
        country: 'Canada',
        year: 2023,
        quarter: 'Q1',
        product: 'Phone',
        sales: 30000,
        profit: 10000,
        units: 50,
      },
      {
        id: 13,
        country: 'UK',
        year: 2022,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 40000,
        profit: 13000,
        units: 28,
      },
      {
        id: 14,
        country: 'UK',
        year: 2022,
        quarter: 'Q1',
        product: 'Phone',
        sales: 32000,
        profit: 10000,
        units: 45,
      },
      {
        id: 15,
        country: 'UK',
        year: 2022,
        quarter: 'Q2',
        product: 'Laptop',
        sales: 42000,
        profit: 14000,
        units: 30,
      },
      {
        id: 16,
        country: 'UK',
        year: 2022,
        quarter: 'Q2',
        product: 'Phone',
        sales: 34000,
        profit: 11000,
        units: 48,
      },
      {
        id: 17,
        country: 'UK',
        year: 2023,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 45000,
        profit: 15000,
        units: 32,
      },
      {
        id: 18,
        country: 'UK',
        year: 2023,
        quarter: 'Q1',
        product: 'Phone',
        sales: 36000,
        profit: 12000,
        units: 52,
      },
      {
        id: 19,
        country: 'Germany',
        year: 2022,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 38000,
        profit: 12000,
        units: 26,
      },
      {
        id: 20,
        country: 'Germany',
        year: 2022,
        quarter: 'Q1',
        product: 'Phone',
        sales: 30000,
        profit: 9000,
        units: 42,
      },
      {
        id: 21,
        country: 'Germany',
        year: 2022,
        quarter: 'Q2',
        product: 'Laptop',
        sales: 40000,
        profit: 13000,
        units: 28,
      },
      {
        id: 22,
        country: 'Germany',
        year: 2022,
        quarter: 'Q2',
        product: 'Phone',
        sales: 32000,
        profit: 10000,
        units: 46,
      },
      {
        id: 23,
        country: 'Germany',
        year: 2023,
        quarter: 'Q1',
        product: 'Laptop',
        sales: 42000,
        profit: 14000,
        units: 30,
      },
      {
        id: 24,
        country: 'Germany',
        year: 2023,
        quarter: 'Q1',
        product: 'Phone',
        sales: 34000,
        profit: 11000,
        units: 48,
      },
    ],
    []
  );

  // Functions to generate custom grouped data
  const groupData = useCallback((data: SalesData[], groupFields: GroupDefinition[]) => {
    if (!groupFields.length) {
      return [...data];
    }

    const result: SalesData[] = [];
    const groupMap: { [key: string]: any } = {};

    // First, create group rows
    data.forEach(item => {
      for (let level = 0; level < groupFields.length; level++) {
        const field = groupFields[level].field;
        // const fieldDisplayName = groupFields[level].displayName;

        // Create a group ID based on all parent groups
        const groupParts = [];
        for (let i = 0; i <= level; i++) {
          groupParts.push(item[groupFields[i].field as keyof SalesData]);
        }
        const groupId = groupParts.join('|');
        const parentGroupId = level > 0 ? groupParts.slice(0, -1).join('|') : undefined;

        // If this group doesn't exist yet, create it
        if (!groupMap[groupId]) {
          const groupValue = String(item[field as keyof SalesData]);

          groupMap[groupId] = {
            items: [],
            expanded: level === 0, // Expand only first level by default
            childCount: 0,
            totals: {
              sales: 0,
              profit: 0,
              units: 0,
            },
          };

          // Add a row for this group
          result.push({
            id: -1 * result.length - 1, // Negative ID to avoid conflicts with real data
            isGroupRow: true,
            groupLevel: level,
            expanded: level === 0,
            groupId,
            parentId: parentGroupId,
            groupValue,
            groupField: field,
            childCount: 0,
            country: field === 'country' ? groupValue : '',
            year: field === 'year' ? parseInt(groupValue) : 0,
            quarter: field === 'quarter' ? groupValue : '',
            product: field === 'product' ? groupValue : '',
            sales: 0,
            profit: 0,
            units: 0,
          });
        }

        // Add this item to the group's items
        groupMap[groupId].items.push(item);
        groupMap[groupId].childCount += 1;
        groupMap[groupId].totals.sales += item.sales;
        groupMap[groupId].totals.profit += item.profit;
        groupMap[groupId].totals.units += item.units;
      }
    });

    // Update group rows with totals and child counts
    for (let i = 0; i < result.length; i++) {
      const row = result[i];
      if (row.isGroupRow && row.groupId) {
        const group = groupMap[row.groupId];
        row.childCount = group.childCount;
        row.sales = group.totals.sales;
        row.profit = group.totals.profit;
        row.units = group.totals.units;
      }
    }

    // Now add actual data rows after all group rows
    data.forEach(item => {
      // Create a full group ID for this item based on all group fields
      const groupParts = [];
      for (let i = 0; i < groupFields.length; i++) {
        groupParts.push(item[groupFields[i].field as keyof SalesData]);
      }
      const fullGroupId = groupParts.join('|');

      // Add item to result with a reference to its parent group
      result.push({
        ...item,
        isGroupRow: false,
        parentId: fullGroupId,
      });
    });

    return result;
  }, []);

  // Function to filter rows based on expanded state
  const filterByExpandedState = useCallback((allRows: SalesData[]) => {
    const expandedGroups = new Set<string>();

    // First, find all expanded groups
    allRows.forEach(row => {
      if (row.isGroupRow && row.expanded && row.groupId) {
        expandedGroups.add(row.groupId);
      }
    });

    // Then, filter rows based on expanded state
    return allRows.filter(row => {
      // Always show group rows
      if (row.isGroupRow) return true;

      // For data rows, check if all parent groups are expanded
      if (row.parentId) {
        let currentGroupId = row.parentId;

        // Split the full parent ID into hierarchy levels
        const parentParts = currentGroupId.split('|');

        // Check each level of the hierarchy
        for (let i = 1; i <= parentParts.length; i++) {
          const groupIdToCheck = parentParts.slice(0, i).join('|');
          if (!expandedGroups.has(groupIdToCheck)) {
            return false; // One of the parent groups is not expanded
          }
        }
        return true; // All parent groups are expanded
      }

      return false; // No parent ID, shouldn't happen with our data structure
    });
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setGroupedData(prevData => {
      const newData = [...prevData];

      // Find the group row and toggle its expanded state
      const groupRowIndex = newData.findIndex(row => row.isGroupRow && row.groupId === groupId);
      if (groupRowIndex >= 0) {
        newData[groupRowIndex] = {
          ...newData[groupRowIndex],
          expanded: !newData[groupRowIndex].expanded,
        };
      }

      return newData;
    });
  }, []);

  // Apply grouping when group definition changes
  useEffect(() => {
    const allGroupedData = groupData(originalData, groupBy);
    setGroupedData(allGroupedData);
  }, [groupBy, groupData, originalData]);

  // Apply filtering when grouped data changes
  useEffect(() => {
    const filteredData = filterByExpandedState(groupedData);
    setRowData(filteredData);
  }, [groupedData, filterByExpandedState]);

  // Custom cell renderer for the first column to show groups with expand/collapse icons
  const groupCellRenderer = (params: any) => {
    const data = params.data;

    if (data.isGroupRow) {
      const paddingLeft = data.groupLevel * 20; // Indent based on group level
      const icon = data.expanded ? '▼' : '►';

      return (
        <div style={{ paddingLeft: `${paddingLeft}px` }} className="flex items-center">
          <span
            onClick={() => toggleGroup(data.groupId)}
            className="cursor-pointer mr-2 text-blue-600 select-none"
          >
            {icon}
          </span>
          <span className="font-medium">{`${data.groupValue} (${data.childCount})`}</span>
        </div>
      );
    }

    // For data rows, add padding to align with the groups
    const paddingLeft = groupBy.length * 20 + 15;
    return <div style={{ paddingLeft: `${paddingLeft}px` }}>{params.value}</div>;
  };

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Data',
        field: 'country', // Default field, will change based on group
        cellRenderer: groupCellRenderer,
        minWidth: 220,
        suppressSizeToFit: true,
      },
      {
        field: 'country',
        headerName: 'Country',
        minWidth: 140,
        // Hide for group rows
        cellRenderer: (params: any) => {
          return params.data.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'year',
        headerName: 'Year',
        minWidth: 120,
        cellRenderer: (params: any) => {
          return params.data.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'quarter',
        headerName: 'Quarter',
        minWidth: 120,
        cellRenderer: (params: any) => {
          return params.data.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'product',
        headerName: 'Product',
        minWidth: 140,
        cellRenderer: (params: any) => {
          return params.data.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'sales',
        headerName: 'Sales',
        minWidth: 150,
        cellRenderer: (params: any) => {
          const value = params.value;
          // For group rows, display as a sum with different styling
          if (params.data.isGroupRow) {
            return <span className="font-medium">{`$${value.toLocaleString()}`}</span>;
          }
          return `$${value.toLocaleString()}`;
        },
      },
      {
        field: 'profit',
        headerName: 'Profit',
        minWidth: 150,
        cellRenderer: (params: any) => {
          const value = params.value;
          if (params.data.isGroupRow) {
            return <span className="font-medium">{`$${value.toLocaleString()}`}</span>;
          }
          return `$${value.toLocaleString()}`;
        },
      },
      {
        field: 'units',
        headerName: 'Units Sold',
        minWidth: 140,
        cellRenderer: (params: any) => {
          const value = params.value;
          if (params.data.isGroupRow) {
            return <span className="font-medium">{value.toLocaleString()}</span>;
          }
          return value.toLocaleString();
        },
      },
    ],
    [groupCellRenderer, groupBy.length]
  );

  // Default column configuration
  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      sortable: true,
      resizable: true,
      filter: true,
    };
  }, []);

  // Row class rules to style group rows differently
  const rowClassRules = useMemo(() => {
    return {
      'bg-blue-50': (params: RowClassParams) => !!params.data?.isGroupRow,
      'font-medium': (params: RowClassParams) => !!params.data?.isGroupRow,
      'cursor-pointer': (params: RowClassParams) => !!params.data?.isGroupRow,
    };
  }, []);

  // Event handler for grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);

    // Auto-size columns after data is loaded
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 0);
  }, []);

  // Function to apply grouping
  const applyGrouping = useCallback((fields: GroupDefinition[]) => {
    setGroupBy(fields);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Sales Data Analysis (Custom Grouping)</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => applyGrouping([{ field: 'country', displayName: 'Country' }])}
            className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
          >
            Group by Country
          </button>
          <button
            onClick={() =>
              applyGrouping([
                { field: 'country', displayName: 'Country' },
                { field: 'year', displayName: 'Year' },
              ])
            }
            className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
          >
            Group by Country & Year
          </button>
          <button
            onClick={() =>
              applyGrouping([
                { field: 'country', displayName: 'Country' },
                { field: 'year', displayName: 'Year' },
                { field: 'quarter', displayName: 'Quarter' },
              ])
            }
            className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
          >
            Group by Country, Year & Quarter
          </button>
          <button
            onClick={() => applyGrouping([{ field: 'product', displayName: 'Product' }])}
            className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
          >
            Group by Product
          </button>
          <button
            onClick={() => applyGrouping([])}
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          >
            Clear Grouping
          </button>
        </div>

        <div className="ag-theme-alpine w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowClassRules={rowClassRules}
            animateRows={true}
            pagination={true}
            paginationPageSize={100} // Set higher to avoid pagination issues with grouped data
            domLayout="normal"
            onGridReady={onGridReady}
            getRowId={params => String(params.data.id)}
          />
        </div>
      </div>
    </div>
  );
};
