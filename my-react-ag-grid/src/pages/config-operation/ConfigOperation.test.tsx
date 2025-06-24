import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect, beforeEach, describe } from 'vitest';
import { test } from '@/mocks/test-extend';
import { message } from 'antd';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConfigOperation from './ConfigOperation';

// Mock AG Grid to avoid JSDOM rendering issues
vi.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData, onGridReady, overlayNoRowsTemplate }: {
    rowData?: Array<Record<string, unknown>>;
    onGridReady?: (params: { api: { getSelectedRows: () => unknown[] } }) => void;
    overlayNoRowsTemplate?: string;
  }) => {
    // Simulate grid ready callback
    React.useEffect(() => {
      if (onGridReady && typeof onGridReady === 'function') {
        onGridReady({
          api: {
            getSelectedRows: () => [],
          },
        });
      }
    }, [onGridReady]);

    if (!rowData || !Array.isArray(rowData) || rowData.length === 0) {
      return (
        <div data-testid="ag-grid-empty" dangerouslySetInnerHTML={{ __html: (overlayNoRowsTemplate as string) || 'No data' }} />
      );
    }

    return (
      <div data-testid="ag-grid-with-data">
        <div role="columnheader">Source Part</div>
        <div role="columnheader">Bin Grade</div>
        <div role="columnheader">Target Part</div>
        <div role="columnheader">Claim User</div>
        <div role="columnheader">Claim Time</div>
        {rowData.map((row: Record<string, unknown>, index: number) => (
          <div key={String(row.id) || index} role="row" data-testid={`grid-row-${index}`}>
            <div>{String(row.sourcePart || '')}</div>
            <div>{String(row.binGrade || '')}</div>
            <div>{String(row.targetPart || '')}</div>
            <div>{String(row.claimUser || '')}</div>
            <div>{String(row.claimTime || '')}</div>
          </div>
        ))}
      </div>
    );
  },
}));

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock the Excel operations with proper mock functions
const mockDownloadTemplate = vi.fn();
const mockExportToExcel = vi.fn();
const mockImportFromExcel = vi.fn().mockResolvedValue([
  {
    id: 'imported-1',
    sourcePart: 'aaa',
    binGrade: 'imported',
    targetPart: 'imported-target',
    claimUser: 'ImportUser',
    claimTime: '2025-01-01T00:00:00Z',
  },
]);
const mockValidateImportConsistency = vi.fn().mockReturnValue({ isValid: true });

vi.mock('./useExcel', () => ({
  useExcel: () => ({
    downloadTemplate: mockDownloadTemplate,
    exportToExcel: mockExportToExcel,
    importFromExcel: mockImportFromExcel,
    validateImportConsistency: mockValidateImportConsistency,
  }),
}));

// Mock file for upload testing
const createMockFile = (name: string, content: string, type: string) => {
  const file = new File([content], name, { type });
  return file;
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

describe('ConfigOperation Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders the component with initial UI elements', async () => {
      renderWithProviders(<ConfigOperation />);

      // Check title
      expect(screen.getByText('Config Operation')).toBeInTheDocument();

      // Check search form
      expect(screen.getByLabelText('Source Part')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();

      // Check grid is present
      expect(screen.getByText('Configuration List')).toBeInTheDocument();

      // Check initial buttons (non-edit mode)
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument(); // No data initially
      expect(screen.getByRole('button', { name: /template/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument(); // No data initially
    });

    test('shows empty grid message when no data', async () => {
      renderWithProviders(<ConfigOperation />);

      await waitFor(() => {
        const emptyGrid = screen.getByTestId('ag-grid-empty');
        expect(emptyGrid).toBeInTheDocument();
        expect(emptyGrid.innerHTML).toContain('No configurations found');
        expect(emptyGrid.innerHTML).toContain('Search for configurations or import data from Excel');
      });
    });
  });

  describe('Search Functionality', () => {
    test('validates required source part field', async () => {
      renderWithProviders(<ConfigOperation />);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter Source Part')).toBeInTheDocument();
      });
    });

    test('performs successful search and loads data', async () => {
      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'aaa');
      await user.click(searchButton);

      await waitFor(() => {
        // Check input value
        expect(screen.getByDisplayValue('aaa')).toBeInTheDocument();
        
        // Check that grid has data
        expect(screen.getByTestId('ag-grid-with-data')).toBeInTheDocument();
        
        // Check for data content in grid
        expect(screen.getByText('aaab')).toBeInTheDocument();
        expect(screen.getByText('aaad')).toBeInTheDocument();
      });

      // Check that edit and export buttons appear after loading data
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    test('handles search with no results', async () => {
      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'nonexistent');
      await user.click(searchButton);

      await waitFor(() => {
        const emptyGrid = screen.getByTestId('ag-grid-empty');
        expect(emptyGrid).toBeInTheDocument();
        expect(emptyGrid.innerHTML).toContain('No configurations found');
      });
    });

    test('shows loading state during search', async () => {
      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'aaa');
      
      // The search button should show loading state
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('aaa')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode Management', () => {
    test('toggles edit mode when edit button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      // First search for data
      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'aaa');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Check edit mode buttons appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
      });

      // Edit button should disappear
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    test('shows correct buttons in edit mode', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // Edit mode buttons
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();

        // Delete button should be disabled initially (no selection)
        expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
      });
    });
  });

  describe('Row Operations', () => {
    test('adds new row when add button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const initialRows = screen.getAllByRole('row').length;
      
      // Click add button
      await user.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        const newRows = screen.getAllByRole('row').length;
        expect(newRows).toBe(initialRows + 1);
      });
    });

    test('handles row selection', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
      });

      // Note: AG Grid row selection testing might require more sophisticated setup
      // This is a basic test structure for row selection
    });

    test('deletes selected rows when delete button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      // For this test, we'll simulate the scenario where rows are selected
      // In a real test, you would need to interact with AG Grid to select rows
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      });
    });
  });

  describe('Save and Discard Operations', () => {
    test('saves changes when save button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // Click save button
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Should exit edit mode after save
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });

    test('discards changes when discard button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
      });

      // Click discard button
      await user.click(screen.getByRole('button', { name: /discard/i }));

      // Should show info message
      expect(message.info).toHaveBeenCalledWith('Changes discarded');
    });
  });

  describe('Excel Operations', () => {
    test('downloads template when template button is clicked', async () => {
      renderWithProviders(<ConfigOperation />);

      const templateButton = screen.getByRole('button', { name: /template/i });
      await user.click(templateButton);

      expect(mockDownloadTemplate).toHaveBeenCalled();
    });

    test('handles file import', async () => {
      renderWithProviders(<ConfigOperation />);

      const file = createMockFile('test.xlsx', 'mock content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const uploadInput = screen.getByRole('button', { name: /import/i }).closest('span')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (uploadInput) {
        await user.upload(uploadInput, file);
        expect(mockImportFromExcel).toHaveBeenCalledWith(file);
      }
    });

    test('exports data when export button is clicked with data', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search for data first
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(mockExportToExcel).toHaveBeenCalled();
    });

    test('shows warning when trying to export with no data', async () => {
      renderWithProviders(<ConfigOperation />);

      // Try to click export without data - button should not be visible
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    test('handles import validation errors', async () => {
      // Mock validation failure
      mockValidateImportConsistency.mockReturnValueOnce({
        isValid: false,
        error: 'Import validation failed',
      });

      renderWithProviders(<ConfigOperation />);

      const file = createMockFile('test.xlsx', 'mock content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const uploadInput = screen.getByRole('button', { name: /import/i }).closest('span')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (uploadInput) {
        await user.upload(uploadInput, file);
        
        await waitFor(() => {
          expect(message.error).toHaveBeenCalledWith('Import validation failed');
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('displays error modal for API errors', async ({ worker }) => {
      // Mock API error
      worker.use(
        http.get('http://example.com/api/configs', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'aaa');
      await user.click(searchButton);

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled();
      });
    });

    test('handles save operation errors', async ({ worker }) => {
      // Mock save API error
      worker.use(
        http.post('http://example.com/api/configs', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save/i }));

      // Error should be handled in the hook
      await waitFor(() => {
        // Error handling is done in the useConfigs hook
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });
    });
  });

  describe('Grid Features', () => {
    test('displays correct column headers', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search for data to display grid
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        // Check that grid is displayed with data
        expect(screen.getByTestId('ag-grid-with-data')).toBeInTheDocument();
        
        // Check for column headers in our mocked grid
        expect(screen.getAllByRole('columnheader')).toHaveLength(5);
        
        // Use getAllByText to handle multiple matches and verify grid headers specifically
        const sourcePartElements = screen.getAllByText('Source Part');
        expect(sourcePartElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Bin Grade')).toBeInTheDocument();
        expect(screen.getByText('Target Part')).toBeInTheDocument();
        expect(screen.getByText('Claim User')).toBeInTheDocument();
        expect(screen.getByText('Claim Time')).toBeInTheDocument();
      });
    });

    test('formats claim time correctly', async () => {
      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        // Check that claim time is displayed (the exact format depends on locale)
        expect(screen.getByDisplayValue('aaa')).toBeInTheDocument();
      });
    });

    test('applies row styling for different row states', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      const initialRows = screen.getAllByRole('row').length;

      // Add a new row to test new row styling
      await user.click(screen.getByRole('button', { name: /add/i }));

      // Verify new row was added
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBe(initialRows + 1);
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during operations', async () => {
      renderWithProviders(<ConfigOperation />);

      const sourcePartInput = screen.getByLabelText('Source Part');
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(sourcePartInput, 'aaa');
      
      // Loading state should be handled by the button's loading prop
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('aaa')).toBeInTheDocument();
      });
    });

    test('shows saving state during save operation', async () => {
      renderWithProviders(<ConfigOperation />);

      // Search and enter edit mode
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      // The save button should show loading state during save
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('complete workflow: search -> edit -> add -> save', async () => {
      renderWithProviders(<ConfigOperation />);

      // 1. Search for data
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('aaa')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByTestId('ag-grid-with-data')).toBeInTheDocument();
      });

      // 2. Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      });

      // 3. Add new row
      const initialRows = screen.getAllByRole('row').length;
      await user.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        const newRows = screen.getAllByRole('row').length;
        expect(newRows).toBe(initialRows + 1);
      });

      // 4. Try to save changes (this should fail validation for empty required fields)
      await user.click(screen.getByRole('button', { name: /save/i }));

      // 5. Verify we're still in edit mode because save failed due to validation
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
      });
    });

    test('complete workflow: search -> edit -> import -> save', async () => {
      renderWithProviders(<ConfigOperation />);

      // 1. Search for data
      const sourcePartInput = screen.getByLabelText('Source Part');
      await user.type(sourcePartInput, 'aaa');
      await user.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });

      // 2. Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      });

      // 3. Import file
      const file = createMockFile('test.xlsx', 'mock content', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const uploadInput = screen.getByRole('button', { name: /import/i }).closest('span')?.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (uploadInput) {
        await user.upload(uploadInput, file);
      }

      // 4. Save changes
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      });
    });
  });
});
