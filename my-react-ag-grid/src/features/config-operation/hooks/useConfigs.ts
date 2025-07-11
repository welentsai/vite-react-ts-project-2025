// src/pages/ConfigOperation/useConfigs.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useCallback, useState } from 'react';
import {
  ConfigApiResponse,
  ConfigSaveRequest,
  QueryFormData,
  SourcePartConfig,
} from '../types/types';

// API functions
const fetchConfigs = async (sourcePart: string): Promise<SourcePartConfig[]> => {
  const response = await fetch(
    `http://example.com/api/configs?sourcePart=${encodeURIComponent(sourcePart)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch configs: ${response.status} ${response.statusText}`);
  }

  const data: ConfigApiResponse = await response.json();
  return data.data.map((config, index) => ({
    ...config,
    id: config.id || `config_${index}`,
  }));
};

const saveConfigs = async (saveRequest: ConfigSaveRequest): Promise<void> => {
  console.log('SaveRequest', saveRequest);
  const response = await fetch('http://example.com/api/configs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saveRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Save failed: ${response.status} ${response.statusText}`);
  }

  if (response.status !== 201) {
    throw new Error('Unexpected response status');
  }
};

// Validation functions
const validateSaveData = (configs: SourcePartConfig[]): { isValid: boolean; error?: string } => {
  if (configs.length === 0) {
    return { isValid: false, error: 'No data to save' };
  }

  // Validation: all source parts should be the same
  const uniqueSourceParts = new Set(configs.map(config => config.sourcePart));
  if (uniqueSourceParts.size > 1) {
    return { isValid: false, error: 'All source parts must be the same' };
  }

  // Check for empty required fields
  const hasEmptyFields = configs.some(
    config => !config.sourcePart.trim() || !config.binGrade.trim() || !config.targetPart.trim()
  );

  if (hasEmptyFields) {
    return {
      isValid: false,
      error: 'Please fill in all required fields (Source Part, Bin Grade, Target Part)',
    };
  }

  return { isValid: true };
};

export const useConfigs = (initialSourcePart?: string) => {
  const queryClient = useQueryClient();
  const [currentSourcePart, setCurrentSourcePart] = useState<string>(initialSourcePart || '');

  // Query for fetching configs based on current source part
  const configQuery = useQuery({
    queryKey: ['configs', currentSourcePart],
    queryFn: () => fetchConfigs(currentSourcePart),
    enabled: !!currentSourcePart.trim(), // Only fetch when sourcePart exists and is not empty
    // retry: 2,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for saving configs
  const saveMutation = useMutation({
    mutationFn: saveConfigs,
    onSuccess: () => {
      message.success('Configurations saved successfully');
      // Invalidate and refetch the current configs
      queryClient.invalidateQueries({ queryKey: ['configs', currentSourcePart] });
    },
    onError: (error: Error) => {
      message.error(`Save failed: ${error.message}`);
    },
  });

  // Fetch configs by source part
  const fetchConfigsBySourcePart = useCallback(
    async (formData: QueryFormData): Promise<SourcePartConfig[]> => {
      if (!formData.sourcePart.trim()) {
        throw new Error('Please enter a Source Part');
      }

      try {
        // Update the current source part to trigger the query
        setCurrentSourcePart(formData.sourcePart);

        // Use fetchQuery to get fresh data and update loading state
        const configs = await queryClient.fetchQuery({
          queryKey: ['configs', formData.sourcePart],
          queryFn: () => fetchConfigs(formData.sourcePart),
          staleTime: 5 * 60 * 1000,
        });

        return configs;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch configurations';
        throw new Error(errorMessage);
      }
    },
    [queryClient]
  );

  // Save configurations
  const saveConfigurations = useCallback(
    (configs: SourcePartConfig[]) => {
      // Validate data before saving
      const validation = validateSaveData(configs);
      if (!validation.isValid) {
        message.error(validation.error!);
        return Promise.reject(new Error(validation.error));
      }

      const sourcePart = configs[0]?.sourcePart || '';
      const saveRequest: ConfigSaveRequest = {
        sourcePart,
        configs,
      };

      return saveMutation.mutateAsync(saveRequest);
    },
    [saveMutation]
  );

  // Refetch configs for current source part
  const refetchConfigs = useCallback(
    async (sourcePart?: string) => {
      const targetSourcePart = sourcePart || currentSourcePart;
      
      if (!targetSourcePart.trim()) {
        return;
      }

      try {
        // Update current source part if different
        if (sourcePart && sourcePart !== currentSourcePart) {
          setCurrentSourcePart(sourcePart);
        }

        // Use fetchQuery to refetch and update loading state
        const configs = await queryClient.fetchQuery({
          queryKey: ['configs', targetSourcePart],
          queryFn: () => fetchConfigs(targetSourcePart),
          staleTime: 0, // Force fresh data
        });

        return configs;
      } catch (error) {
        message.error('Failed to refresh data');
        throw error;
      }
    },
    [queryClient, currentSourcePart]
  );

  // Get cached configs for specific source part
  const getCachedConfigs = useCallback(
    (sourcePart?: string): SourcePartConfig[] | undefined => {
      const targetSourcePart = sourcePart || currentSourcePart;
      return queryClient.getQueryData(['configs', targetSourcePart]);
    },
    [queryClient, currentSourcePart]
  );

  // Clear configs cache
  const clearConfigsCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['configs'] });
    setCurrentSourcePart('');
  }, [queryClient]);

  // Clear specific source part cache
  const clearSourcePartCache = useCallback(
    (sourcePart?: string) => {
      const targetSourcePart = sourcePart || currentSourcePart;
      queryClient.removeQueries({ queryKey: ['configs', targetSourcePart] });
      
      // If clearing current source part, reset it
      if (targetSourcePart === currentSourcePart) {
        setCurrentSourcePart('');
      }
    },
    [queryClient, currentSourcePart]
  );

  // Switch to different source part
  const switchSourcePart = useCallback(
    (sourcePart: string) => {
      setCurrentSourcePart(sourcePart);
    },
    []
  );

  return {
    // Query state - now properly reflects loading/error states
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    data: configQuery.data,
    isFetching: configQuery.isFetching,
    isSuccess: configQuery.isSuccess,
    isError: configQuery.isError,

    // Mutation state
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    saveSuccess: saveMutation.isSuccess,

    // Current state
    currentSourcePart,

    // Actions
    fetchConfigsBySourcePart,
    saveConfigurations,
    refetchConfigs,
    getCachedConfigs,
    clearConfigsCache,
    clearSourcePartCache,
    switchSourcePart,

    // Raw query and mutation objects for advanced usage
    configQuery,
    saveMutation,
  };
};