// src/features/material-query/utils/validation.ts
import * as z from "zod/v4";
import {
  DirectMaterialSchema,
  IndirectMaterialSchema,
  MaterialResponseSchema,
  MaterialQueryFormSchema,
} from '../types/schemas';
import { MaterialResponse } from '../types/types';

// Validation helper functions
export const validateDirectMaterial = (data: unknown) => {
  return DirectMaterialSchema.safeParse(data);
};

export const validateIndirectMaterial = (data: unknown) => {
  return IndirectMaterialSchema.safeParse(data);
};

export const validateMaterialResponse = (data: unknown) => {
  return MaterialResponseSchema.safeParse(data);
};

export const validateQueryForm = (data: unknown) => {
  return MaterialQueryFormSchema.safeParse(data);
};

// Error handling with Zod
export const parseApiError = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return `Validation error: ${error.issues.map(issue => issue.message).join(', ')}`;
  }
  
  // Fallback for non-JSON:API errors
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Data transformation with validation
export const transformApiResponse = (rawData: unknown): MaterialResponse['data'] | null => {
  const result = MaterialResponseSchema.safeParse(rawData);
  
  if (!result.success) {
    console.error('API Response validation failed:', result.error);
    return null;
  }
  
  return result.data.data;
};
