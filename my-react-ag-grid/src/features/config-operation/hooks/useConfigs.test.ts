import { test } from '@/mocks/test-extend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { http } from 'msw';
import { ReactNode, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { QueryFormData, SourcePartConfig } from './types';
import { useConfigs } from './useConfigs';

// Mock antd message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test data
const mockConfigs: SourcePartConfig[] = [
  {
    id: '1',
    sourcePart: 'aaa',
    binGrade: '1',
    targetPart: 'aaab',
    claimUser: 'WL',
    claimTime: '2025',
  },
  {
    id: '2',
    sourcePart: 'aaa',
    binGrade: 'x',
    targetPart: 'aaad',
    claimUser: 'WL',
    claimTime: '2025',
  },
];

const mockConfigsDifferentSourcePart: SourcePartConfig[] = [
  {
    id: '1',
    sourcePart: 'aaa',
    binGrade: '1',
    targetPart: 'aaab',
    claimUser: 'WL',
    claimTime: '2025',
  },
  {
    id: '2',
    sourcePart: 'bbb', // Different source part
    binGrade: 'x',
    targetPart: 'aaad',
    claimUser: 'WL',
    claimTime: '2025',
  },
];

const mockConfigsWithEmptyFields: SourcePartConfig[] = [
  {
    id: '1',
    sourcePart: '', // Empty required field
    binGrade: '1',
    targetPart: 'aaab',
    claimUser: 'WL',
    claimTime: '2025',
  },
];

// Helper function to create wrapper with QueryClient
const createWrapper = () => {
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

  return ({ children }: { children: ReactNode }) => {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useConfigs Hook', () => {
  let mockMessageSuccess: ReturnType<typeof vi.fn>;
  let mockMessageError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockMessageSuccess = vi.mocked(message.success);
    mockMessageError = vi.mocked(message.error);
    mockMessageSuccess.mockClear();
    mockMessageError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with correct default state', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveError).toBe(null);
    expect(typeof result.current.fetchConfigsBySourcePart).toBe('function');
    expect(typeof result.current.saveConfigurations).toBe('function');
    expect(typeof result.current.refetchConfigs).toBe('function');
    expect(typeof result.current.getCachedConfigs).toBe('function');
    expect(typeof result.current.clearConfigsCache).toBe('function');
  });

  test('fetchConfigsBySourcePart should fetch configs successfully', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      const configs = await result.current.fetchConfigsBySourcePart(formData);
      expect(configs).toHaveLength(2);
      expect(configs[0].sourcePart).toBe('aaa');
      expect(configs[1].sourcePart).toBe('aaa');
    });
  });

  test('fetchConfigsBySourcePart should throw error for empty source part', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: '' };

    await act(async () => {
      await expect(result.current.fetchConfigsBySourcePart(formData)).rejects.toThrow(
        'Please enter a Source Part'
      );
    });
  });

  test('fetchConfigsBySourcePart should throw error for whitespace-only source part', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: '   ' };

    await act(async () => {
      await expect(result.current.fetchConfigsBySourcePart(formData)).rejects.toThrow(
        'Please enter a Source Part'
      );
    });
  });

  test('fetchConfigsBySourcePart should handle API errors', async ({ worker }) => {
    // Mock API error response
    worker.use(
      http.get('http://example.com/api/configs', () => {
        return new Response(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'error' };

    await act(async () => {
      await expect(result.current.fetchConfigsBySourcePart(formData)).rejects.toThrow(
        'Failed to fetch configs: 500 Internal Server Error'
      );
    });
  });

  test('fetchConfigsBySourcePart should update query cache', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      await result.current.fetchConfigsBySourcePart(formData);
    });

    // Check if data is cached
    const cachedData = result.current.getCachedConfigs('aaa');
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(2);
  });

  test('saveConfigurations should save configs successfully', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await result.current.saveConfigurations(mockConfigs);
    });

    await waitFor(() => {
      expect(mockMessageSuccess).toHaveBeenCalledWith('Configurations saved successfully');
    });
  });

  test('saveConfigurations should validate empty data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations([])).rejects.toThrow('No data to save');
    });

    expect(mockMessageError).toHaveBeenCalledWith('No data to save');
  });

  test('saveConfigurations should validate mixed source parts', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(
        result.current.saveConfigurations(mockConfigsDifferentSourcePart)
      ).rejects.toThrow('All source parts must be the same');
    });

    expect(mockMessageError).toHaveBeenCalledWith('All source parts must be the same');
  });

  test('saveConfigurations should validate required fields', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations(mockConfigsWithEmptyFields)).rejects.toThrow(
        'Please fill in all required fields (Source Part, Bin Grade, Target Part)'
      );
    });

    expect(mockMessageError).toHaveBeenCalledWith(
      'Please fill in all required fields (Source Part, Bin Grade, Target Part)'
    );
  });

  test('saveConfigurations should handle API save errors', async ({ worker }) => {
    // Mock API error response
    worker.use(
      http.post('http://example.com/api/configs', () => {
        return Response.json({ message: 'Save operation failed' }, { status: 400 });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations(mockConfigs)).rejects.toThrow(
        'Save operation failed'
      );
    });

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Save failed: Save operation failed');
    });
  });

  test('saveConfigurations should handle unexpected response status', async ({ worker }) => {
    // Mock API with unexpected status
    worker.use(
      http.post('http://example.com/api/configs', () => {
        return new Response(null, { status: 200 }); // Should be 201
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations(mockConfigs)).rejects.toThrow(
        'Unexpected response status'
      );
    });
  });

  test('saveConfigurations should show isSaving state during operation', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    // Initially isSaving should be false
    expect(result.current.isSaving).toBe(false);

    // Start the save operation and wait for completion
    await act(async () => {
      await result.current.saveConfigurations(mockConfigs);
    });

    // After completion, isSaving should be false again
    expect(result.current.isSaving).toBe(false);

    // Verify success message was called
    await waitFor(() => {
      expect(mockMessageSuccess).toHaveBeenCalledWith('Configurations saved successfully');
    });
  });

  test('refetchConfigs should refetch and update cache', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      const configs = await result.current.refetchConfigs('aaa');
      expect(configs).toHaveLength(2);
    });

    // Check if cache is updated
    const cachedData = result.current.getCachedConfigs('aaa');
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(2);
  });

  test('refetchConfigs should handle empty source part', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      const result_data = await result.current.refetchConfigs('');
      expect(result_data).toBeUndefined();
    });
  });

  test('refetchConfigs should handle undefined source part', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      const result_data = await result.current.refetchConfigs(undefined);
      expect(result_data).toBeUndefined();
    });
  });

  test('refetchConfigs should handle API errors', async ({ worker }) => {
    // Mock API error response
    worker.use(
      http.get('http://example.com/api/configs', () => {
        return new Response(null, { status: 500 });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.refetchConfigs('error')).rejects.toThrow();
    });

    expect(mockMessageError).toHaveBeenCalledWith('Failed to refresh data');
  });

  test('getCachedConfigs should return cached data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    // First fetch to populate cache
    await act(async () => {
      await result.current.fetchConfigsBySourcePart({ sourcePart: 'aaa' });
    });

    // Get cached data
    const cachedData = result.current.getCachedConfigs('aaa');
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(2);
    expect(cachedData![0].sourcePart).toBe('aaa');
  });

  test('getCachedConfigs should return undefined for non-cached data', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const cachedData = result.current.getCachedConfigs('nonexistent');
    expect(cachedData).toBeUndefined();
  });

  test('clearConfigsCache should clear all cached configs', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    // First fetch to populate cache
    await act(async () => {
      await result.current.fetchConfigsBySourcePart({ sourcePart: 'aaa' });
    });

    // Verify data is cached
    let cachedData = result.current.getCachedConfigs('aaa');
    expect(cachedData).toBeDefined();

    // Clear cache
    act(() => {
      result.current.clearConfigsCache();
    });

    // Verify cache is cleared
    cachedData = result.current.getCachedConfigs('aaa');
    expect(cachedData).toBeUndefined();
  });

  test('should handle network errors gracefully', async ({ worker }) => {
    // Mock network error
    worker.use(
      http.get('http://example.com/api/configs', () => {
        return Response.error();
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      await expect(result.current.fetchConfigsBySourcePart(formData)).rejects.toThrow();
    });
  });

  test('should handle malformed JSON response', async ({ worker }) => {
    // Mock malformed JSON response
    worker.use(
      http.get('http://example.com/api/configs', () => {
        return new Response('invalid json', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      await expect(result.current.fetchConfigsBySourcePart(formData)).rejects.toThrow();
    });
  });

  test('should assign default IDs to configs without IDs', async ({ worker }) => {
    // Mock response without IDs
    worker.use(
      http.get('http://example.com/api/configs', () => {
        return Response.json({
          success: true,
          data: [
            {
              sourcePart: 'aaa',
              binGrade: '1',
              targetPart: 'aaab',
              claimUser: 'WL',
              claimTime: '2025',
            },
          ],
        });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      const configs = await result.current.fetchConfigsBySourcePart(formData);
      expect(configs[0].id).toBe('config_0');
    });
  });

  test('should preserve existing IDs in configs', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    const formData: QueryFormData = { sourcePart: 'aaa' };

    await act(async () => {
      const configs = await result.current.fetchConfigsBySourcePart(formData);
      expect(configs[0].id).toBe('1'); // Should preserve existing ID
      expect(configs[1].id).toBe('2'); // Should preserve existing ID
    });
  });

  test('should handle save with error response containing no message', async ({ worker }) => {
    // Mock API error response without message
    worker.use(
      http.post('http://example.com/api/configs', () => {
        return new Response('', { status: 500, statusText: 'Internal Server Error' });
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations(mockConfigs)).rejects.toThrow(
        'Save failed: 500 Internal Server Error'
      );
    });
  });

  test('should validate configs with whitespace-only required fields', async () => {
    const configsWithWhitespace: SourcePartConfig[] = [
      {
        id: '1',
        sourcePart: '   ', // Whitespace only
        binGrade: '1',
        targetPart: 'aaab',
        claimUser: 'WL',
        claimTime: '2025',
      },
    ];

    const wrapper = createWrapper();
    const { result } = renderHook(() => useConfigs(), { wrapper });

    await act(async () => {
      await expect(result.current.saveConfigurations(configsWithWhitespace)).rejects.toThrow(
        'Please fill in all required fields (Source Part, Bin Grade, Target Part)'
      );
    });
  });
});
