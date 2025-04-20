// src/components/CustomGroupingGrid.tsx
import {
  AllCommunityModule,
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  provideGlobalGridOptions,
  RowClassParams,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SAMPLE_DATA } from './type';

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
}

// Type for group-specific data
interface GroupMetadata {
  isGroupRow: boolean;
  groupLevel: number;
  expanded: boolean;
  parentId?: string;
  groupId?: string;
  childCount: number;
  groupValue: string;
  groupField: string;
}

// Combined type for row data (either regular or group row)
type GridRowData = SalesData & Partial<GroupMetadata>;

// Type for group definition
interface GroupDefinition {
  field: keyof SalesData;
  displayName: string;
}

// Numeric fields that should be aggregated
const AGGREGATION_FIELDS: (keyof SalesData)[] = ['sales', 'profit', 'units'];

export const CustomGroupingGrid: React.FC = () => {
  const [gridApi, setGridApi] = useState<any>(null);
  const [gridKey, setGridKey] = useState<number>(0); // Add a key to force re-renders
  const [groupBy, setGroupBy] = useState<GroupDefinition[]>([]);
  const [groupedData, setGroupedData] = useState<GridRowData[]>([]);
  const [visibleRows, setVisibleRows] = useState<GridRowData[]>([]);

  // Original data - could also come from props or an API call
  const originalData = useMemo<SalesData[]>(() => SAMPLE_DATA, []);

  // Group data transformation function
  const createGroupedData = useCallback(
    (data: SalesData[], groupFields: GroupDefinition[]): GridRowData[] => {
      if (!groupFields.length) {
        return [...data];
      }

      // Map to track groups
      const groupMap = new Map<
        string,
        {
          items: SalesData[];
          expanded: boolean;
          childCount: number;
          totals: Record<string, number>;
          rowIndex: number;
        }
      >();

      // We'll construct the result in two phases for better structure
      const groupRows: GridRowData[] = [];

      // First pass: create group rows and collect group information
      data.forEach(item => {
        for (let level = 0; level < groupFields.length; level++) {
          const field = groupFields[level].field;

          // Create a group ID based on all parent groups
          const groupParts = groupFields.slice(0, level + 1).map(g => String(item[g.field]));

          const groupId = groupParts.join('|');
          const parentGroupId = level > 0 ? groupParts.slice(0, -1).join('|') : undefined;
          const groupValue = String(item[field]);

          // If this group doesn't exist yet, create it
          if (!groupMap.has(groupId)) {
            // Initialize group with default values
            const rowIndex = groupRows.length;

            groupMap.set(groupId, {
              items: [],
              expanded: true, // Default to expanded
              childCount: 0,
              rowIndex,
              totals: AGGREGATION_FIELDS.reduce(
                (acc, field) => {
                  acc[field] = 0;
                  return acc;
                },
                {} as Record<string, number>
              ),
            });

            // Create initial group row
            const groupRow: GridRowData = {
              id: -1 * (rowIndex + 1), // Negative ID to avoid conflicts
              isGroupRow: true,
              groupLevel: level,
              expanded: true, // Default to expanded
              groupId,
              parentId: parentGroupId,
              groupValue,
              groupField: field,
              childCount: 0,
              // Initialize numeric values
              sales: 0,
              profit: 0,
              units: 0,
              // Set the grouped field value
              ...Object.fromEntries(
                Object.keys(item)
                  .filter(key => key === field)
                  .map(key => [key, item[key as keyof SalesData]])
              ),
            };

            groupRows.push(groupRow);
          }

          // Add this item to the group and update aggregates
          const group = groupMap.get(groupId)!;
          group.items.push(item);
          group.childCount += 1;

          // Update all aggregation fields
          AGGREGATION_FIELDS.forEach(field => {
            group.totals[field] += item[field];
          });
        }
      });

      // Update group rows with totals and child counts
      for (let i = 0; i < groupRows.length; i++) {
        const row = groupRows[i];
        if (row.isGroupRow && row.groupId) {
          const group = groupMap.get(row.groupId);
          if (group) {
            row.childCount = group.childCount;

            // Update all aggregation fields
            AGGREGATION_FIELDS.forEach(field => {
              row[field] = group.totals[field];
            });
          }
        }
      }

      // Create the final result array with interleaved structure
      const result: GridRowData[] = [];

      // Helper function to add a group and its children recursively
      const addGroupWithChildren = (groupId: string, level: number) => {
        // Add the group row first
        const group = groupMap.get(groupId);
        if (!group) return;

        const groupRow = groupRows[group.rowIndex];
        result.push(groupRow);

        // If expanded and only one level of grouping, add all child data rows immediately after the group
        if (group.expanded && groupFields.length === 1) {
          // Sort items by the first non-grouped field for better organization
          const sortedItems = [...group.items].sort((a, b) => {
            // Find first non-grouped field
            for (const key of Object.keys(a) as Array<keyof SalesData>) {
              if (key !== groupFields[0].field && typeof a[key] === 'string') {
                return String(a[key]).localeCompare(String(b[key]));
              }
            }
            return 0;
          });

          // Add all child data rows
          sortedItems.forEach(item => {
            result.push({
              ...item,
              isGroupRow: false,
              parentId: groupId,
            });
          });
        } else if (group.expanded && groupFields.length > 1) {
          // For expanded multi-level grouping, find and add child groups
          const nextLevel = level + 1;
          if (nextLevel < groupFields.length) {
            // Get unique values for the next level
            const nextField = groupFields[nextLevel].field;
            const childValues = new Set(group.items.map(item => String(item[nextField])));

            // For each child value, recursively add its group
            childValues.forEach(childValue => {
              const childGroupId = `${groupId}|${childValue}`;
              addGroupWithChildren(childGroupId, nextLevel);
            });
          }
        }
        // If not expanded, don't add children
      };

      // Start with top-level groups
      if (groupFields.length > 0) {
        const field = groupFields[0].field;
        const uniqueValues = new Set(data.map(item => String(item[field])));

        uniqueValues.forEach(value => {
          const groupId = value;
          addGroupWithChildren(groupId, 0);
        });
      }

      // If no rows were added (should never happen), fall back to flat data
      if (result.length === 0) {
        return data.map(item => ({
          ...item,
          isGroupRow: false,
        }));
      }

      return result;
    },
    []
  );

  // Get visible rows based on expanded state
  const getVisibleRows = useCallback(
    (allRows: GridRowData[]): GridRowData[] => {
      const result: GridRowData[] = [];
      const expandedGroups = new Set<string>();

      // First pass: collect all expanded groups
      allRows.forEach(row => {
        if (row.isGroupRow && row.expanded && row.groupId) {
          expandedGroups.add(row.groupId);
        }
      });

      // Second pass: add visible rows
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        
        // Always show group rows
        if (row.isGroupRow) {
          result.push(row);
          continue;
        }
        
        // For data rows, check if parent is expanded
        if (row.parentId) {
          if (expandedGroups.has(row.parentId)) {
            result.push(row);
          }
        } else if (!groupBy.length) {
          // Only show non-grouped rows when no grouping is applied
          result.push(row);
        }
      }

      return result;
    },
    [groupBy]
  );

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setGroupedData(prevData => {
      // Find the current group and get its expanded state
      const currentGroup = prevData.find(row => row.isGroupRow && row.groupId === groupId);
      const newExpandedState = currentGroup ? !currentGroup.expanded : false;
      
      // Update the expanded state for the group
      const updatedData = prevData.map(row =>
        row.isGroupRow && row.groupId === groupId 
          ? { ...row, expanded: newExpandedState } 
          : row
      );
      
      // Force grid refresh by incrementing key after state update
      setTimeout(() => {
        setGridKey(prev => prev + 1);
      }, 0);
      
      return updatedData;
    });
  }, []);

  // Generate grouped data when grouping changes
  useEffect(() => {
    // When grouping changes, make sure all groups start as expanded
    const groupedRows = createGroupedData(originalData, groupBy);
    
    // Ensure all group rows have expanded set correctly
    const updatedRows = groupedRows.map(row => {
      if (row.isGroupRow) {
        return { ...row, expanded: true }; // Default to expanded
      }
      return row;
    });
    
    setGroupedData(updatedRows);
    
    // Reset grid key to force a full re-render
    setGridKey(prev => prev + 1);
  }, [groupBy, createGroupedData, originalData]);

  // Update visible rows when grouped data changes
  useEffect(() => {
    const visibleRows = getVisibleRows(groupedData);
    setVisibleRows(visibleRows);
  }, [groupedData, getVisibleRows]);

  // Custom cell renderer function for the group cell
  const GroupCellRenderer = useCallback(
    (params: ICellRendererParams) => {
      const data = params.data as GridRowData;

      if (!data) {
        return null;
      }

      if (data.isGroupRow) {
        const paddingLeft = (data.groupLevel || 0) * 20; // Indent based on level
        const isExpanded = !!data.expanded;
        
        return (
          <div style={{ paddingLeft: `${paddingLeft}px` }} className="flex items-center">
            <span
              onClick={() => {
                if (data.groupId) {
                  toggleGroup(data.groupId);
                }
              }}
              className="cursor-pointer mr-2 text-blue-600 select-none"
              style={{ minWidth: '12px', display: 'inline-block' }}
            >
              {isExpanded ? '▼' : '►'}
            </span>
            <span className="font-medium text-blue-700">
              {`${data.groupValue} (${data.childCount})`}
            </span>
          </div>
        );
      }

      // For data rows, add padding to align with groups
      const dataRowPadding = (data.groupLevel || 0) * 20 + 40; // More indent for data rows

      return <div style={{ paddingLeft: `${dataRowPadding}px` }}>{params.value}</div>;
    },
    [toggleGroup]
  );

  // Value formatter for numeric columns
  const formatCurrency = useCallback((value: number): string => {
    return `$${value.toLocaleString()}`;
  }, []);

  const formatNumber = useCallback((value: number): string => {
    return value.toLocaleString();
  }, []);

  // Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Data',
        field: 'country', // Default field, will change based on group
        cellRenderer: GroupCellRenderer,
        minWidth: 220,
        suppressSizeToFit: true,
      },
      {
        field: 'country',
        headerName: 'Country',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          return data?.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'year',
        headerName: 'Year',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          return data?.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'quarter',
        headerName: 'Quarter',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          return data?.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'product',
        headerName: 'Product',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          return data?.isGroupRow ? '' : params.value;
        },
      },
      {
        field: 'sales',
        headerName: 'Sales',
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          const value = params.value as number;

          return (
            <span className={data?.isGroupRow ? 'font-medium' : ''}>{formatCurrency(value)}</span>
          );
        },
      },
      {
        field: 'profit',
        headerName: 'Profit',
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          const value = params.value as number;

          return (
            <span className={data?.isGroupRow ? 'font-medium' : ''}>{formatCurrency(value)}</span>
          );
        },
      },
      {
        field: 'units',
        headerName: 'Units Sold',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams) => {
          const data = params.data as GridRowData;
          const value = params.value as number;

          return (
            <span className={data?.isGroupRow ? 'font-medium' : ''}>{formatNumber(value)}</span>
          );
        },
      },
    ],
    [GroupCellRenderer, formatCurrency, formatNumber]
  );

  // Default column configuration
  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      sortable: true,
      resizable: true,
      filter: true,
    }),
    []
  );

  // Row class rules for styling
  const rowClassRules = useMemo(
    () => ({
      'bg-blue-50': (params: RowClassParams) => !!params.data?.isGroupRow,
      'font-medium': (params: RowClassParams) => !!params.data?.isGroupRow,
      'cursor-pointer': (params: RowClassParams) => !!params.data?.isGroupRow,
      // Add special styling for data rows in single-level grouping
      'border-b border-gray-100': (params: RowClassParams) =>
        !params.data?.isGroupRow && groupBy.length === 1,
      'hover:bg-gray-50': (params: RowClassParams) =>
        !params.data?.isGroupRow && groupBy.length === 1,
    }),
    [groupBy.length]
  );

  // Handle grid ready event
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);

    // Auto-size columns after data is loaded
    requestAnimationFrame(() => {
      params.api.sizeColumnsToFit();
    });
  }, []);

  // Predefined grouping options
  const groupingOptions = useMemo<Array<{ label: string; grouping: GroupDefinition[] }>>(
    () => [
      {
        label: 'Group by Country',
        grouping: [{ field: 'country', displayName: 'Country' }],
      },
      {
        label: 'Group by Country & Year',
        grouping: [
          { field: 'country', displayName: 'Country' },
          { field: 'year', displayName: 'Year' },
        ],
      },
      {
        label: 'Group by Country, Year & Quarter',
        grouping: [
          { field: 'country', displayName: 'Country' },
          { field: 'year', displayName: 'Year' },
          { field: 'quarter', displayName: 'Quarter' },
        ],
      },
      {
        label: 'Group by Product',
        grouping: [{ field: 'product', displayName: 'Product' }],
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Sales Data Analysis (Custom Grouping)</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {groupingOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => setGroupBy(option.grouping)}
              className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
            >
              {option.label}
            </button>
          ))}
          <button
            onClick={() => setGroupBy([])}
            className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          >
            Clear Grouping
          </button>
        </div>

        <div className="ag-theme-alpine w-full h-[600px] rounded-lg overflow-hidden border border-gray-200">
          <AgGridReact
            key={gridKey} // Add key to force re-render
            rowData={visibleRows}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowClassRules={rowClassRules}
            animateRows={true}
            pagination={true}
            paginationPageSize={100} // Higher to avoid pagination issues with grouped data
            domLayout="normal"
            onGridReady={onGridReady}
            getRowId={params => String(params.data.id)}
          />
        </div>
      </div>
    </div>
  );
};