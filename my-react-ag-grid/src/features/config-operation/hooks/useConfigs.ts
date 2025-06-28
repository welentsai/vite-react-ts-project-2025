// src/pages/ConfigOperation/useConfigs.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useCallback } from 'react';
import { ConfigApiResponse, ConfigSaveRequest, QueryFormData, SourcePartConfig } from '../types/types';

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

export const useConfigs = () => {
  const queryClient = useQueryClient();

  // Query for fetching configs
  const configQuery = useQuery({
    queryKey: ['configs'],
    queryFn: () => Promise.resolve([]), // Empty initially
    enabled: false, // Only fetch when explicitly called
  });

  // Mutation for saving configs
  const saveMutation = useMutation({
    mutationFn: saveConfigs,
    onSuccess: () => {
      message.success('Configurations saved successfully');
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['configs'] });
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
        const configs = await fetchConfigs(formData.sourcePart);

        // Update query cache
        queryClient.setQueryData(['configs', formData.sourcePart], configs);

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

  // Refetch configs for a specific source part
  const refetchConfigs = useCallback(
    async (sourcePart?: string) => {
      if (!sourcePart) {
        return;
      }

      try {
        const configs = await fetchConfigs(sourcePart);
        queryClient.setQueryData(['configs', sourcePart], configs);
        return configs;
      } catch (error) {
        message.error('Failed to refresh data');
        throw error;
      }
    },
    [queryClient]
  );

  // Get cached configs
  const getCachedConfigs = useCallback(
    (sourcePart: string): SourcePartConfig[] | undefined => {
      return queryClient.getQueryData(['configs', sourcePart]);
    },
    [queryClient]
  );

  // Clear configs cache
  const clearConfigsCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['configs'] });
  }, [queryClient]);

  return {
    // Query state
    isLoading: configQuery.isLoading,
    error: configQuery.error,

    // Mutation state
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,

    // Actions
    fetchConfigsBySourcePart,
    saveConfigurations,
    refetchConfigs,
    getCachedConfigs,
    clearConfigsCache,

    // Raw query and mutation objects for advanced usage
    configQuery,
    saveMutation,
  };
};
