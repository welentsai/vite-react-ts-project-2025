// src/features/material-query/types/types.ts
import type * as z from "zod/v4";
import {
  DirectMaterialSchema,
  IndirectMaterialSchema,
  MaterialQueryFormSchema,
  MaterialResponseSchema,
  MaterialErrorResponseSchema,
  MaterialQueryStateSchema,
} from './schemas';

// Inferred Types from Schemas
export type DirectMaterial = z.infer<typeof DirectMaterialSchema>;
export type IndirectMaterial = z.infer<typeof IndirectMaterialSchema>;
export type MaterialQueryForm = z.infer<typeof MaterialQueryFormSchema>;
export type MaterialResponse = z.infer<typeof MaterialResponseSchema>;
export type MaterialErrorResponse = z.infer<typeof MaterialErrorResponseSchema>;
export type MaterialQueryState = z.infer<typeof MaterialQueryStateSchema>;

// Additional utility types
export type MaterialType = 'direct' | 'indirect';
export type Material = DirectMaterial | IndirectMaterial;

// API Request types
export interface GetMaterialsRequest {
  equipmentId: string;
}

// Component Props types
export interface MaterialQueryProps {
  className?: string;
  onError?: (error: string) => void;
  onSuccess?: (data: MaterialResponse['data']) => void;
}

export interface MaterialGridProps<T extends Material> {
  materials: T[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

// Action types for reducer (with Zod validation)
export type MaterialQueryAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MATERIALS'; payload: MaterialResponse['data'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: MaterialType }
  | { type: 'SET_EQUIPMENT_ID'; payload: string | null }
  | { type: 'CLEAR_DATA' }
  | { type: 'RESET_STATE' };
