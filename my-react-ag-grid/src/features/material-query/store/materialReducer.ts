// src/features/material-query/store/materialReducer.ts
import { match } from 'ts-pattern';
import { MaterialQueryAction, MaterialQueryState } from '../types/types';

const initialState: MaterialQueryState = {
  directMaterials: [],
  indirectMaterials: [],
  isLoading: false,
  error: null,
  activeTab: 'direct',
  equipmentId: null,
  lastUpdated: undefined,
};

export const materialReducer = (
  state: MaterialQueryState = initialState,
  action: MaterialQueryAction
): MaterialQueryState => {
  return match(action)
    .with({ type: 'SET_LOADING' }, ({ payload }) => ({
      ...state,
      isLoading: payload,
      error: null,
    }))
    .with({ type: 'SET_MATERIALS' }, ({ payload }) => ({
      ...state,
      directMaterials: payload.directMaterials,
      indirectMaterials: payload.indirectMaterials,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
    }))
    .with({ type: 'SET_ERROR' }, ({ payload }) => ({
      ...state,
      isLoading: false,
      error: payload,
    }))
    .with({ type: 'SET_ACTIVE_TAB' }, ({ payload }) => ({
      ...state,
      activeTab: payload,
    }))
    .with({ type: 'SET_EQUIPMENT_ID' }, ({ payload }) => ({
      ...state,
      equipmentId: payload,
    }))
    .with({ type: 'CLEAR_DATA' }, () => ({
      ...state,
      directMaterials: [],
      indirectMaterials: [],
      error: null,
      lastUpdated: undefined,
    }))
    .with({ type: 'RESET_STATE' }, () => initialState)
    .exhaustive();
};
