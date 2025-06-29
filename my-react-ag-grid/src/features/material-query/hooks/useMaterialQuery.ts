// src/features/material-query/hooks/useMaterialQuery.ts
import { useReducer, useCallback } from 'react';
import { useMaterials } from './useMaterials';
import { materialReducer } from '../store/materialReducer';
import { MaterialQueryState, MaterialQueryForm } from '../types/types';

const initialState: MaterialQueryState = {
  directMaterials: [],
  indirectMaterials: [],
  isLoading: false,
  error: null,
  activeTab: 'direct',
  equipmentId: null,
  lastUpdated: undefined,
};

export const useMaterialQuery = () => {
  const [state, dispatch] = useReducer(materialReducer, initialState);

  // Fetch materials data using React Query
  const { data, isLoading, error, refetch } = useMaterials(state.equipmentId || undefined);

  // Update state based on query results
  if (isLoading !== state.isLoading) {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }

  if (error && error.message !== state.error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
  }

  if (data) {
    // Simple check to avoid unnecessary updates
    if (
      JSON.stringify(data.directMaterials) !== JSON.stringify(state.directMaterials) ||
      JSON.stringify(data.indirectMaterials) !== JSON.stringify(state.indirectMaterials)
    ) {
      dispatch({ type: 'SET_MATERIALS', payload: data });
    }
  }

  // Handle form submission
  const handleSearch = useCallback((formData: MaterialQueryForm) => {
    dispatch({ type: 'SET_EQUIPMENT_ID', payload: formData.equipmentId });
    refetch();
  }, [refetch]);

  // Handle tab change
  const setActiveTab = useCallback((tab: 'direct' | 'indirect') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  // Reset state
  const reset = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  return {
    state,
    handleSearch,
    setActiveTab,
    reset,
    clearData,
    isLoading,
    error: state.error,
  };
};
