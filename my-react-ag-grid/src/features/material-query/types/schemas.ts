// src/features/material-query/types/schemas.ts
import * as z from "zod/v4";

// Base Material Schema (common fields)
const BaseItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
});

// Direct Material Schema
export const DirectMaterialSchema = BaseItemSchema.extend({
  type: z.string().min(1, 'Type is required'),
  grade: z.string().min(1, 'Grade is required'),
  color: z.string().min(1, 'Color is required'),
  weight: z.number().positive('Weight must be positive'),
  volume: z.number().positive('Volume must be positive'),
});

// Indirect Material Schema
export const IndirectMaterialSchema = BaseItemSchema.extend({
  category: z.string().min(1, 'Category is required'),
  modelNumber: z.string().min(1, 'Model number is required'),
  costCenterCode: z.string().min(1, 'Cost center code is required'),
  unitCost: z.number().positive('Unit cost must be positive'),
});

// Query Form Schema
export const MaterialQueryFormSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
});

// API Response Schema (JSON:API compliant)
export const MaterialResponseSchema = z.object({
  data: z.object({
    directMaterials: z.array(DirectMaterialSchema),
    indirectMaterials: z.array(IndirectMaterialSchema),
  }),
  meta: z.object({
    equipmentId: z.string(),
    timestamp: z.string().datetime(),
    totalDirectMaterials: z.number().optional(),
    totalIndirectMaterials: z.number().optional(),
  }).optional(),
  links: z.object({
    self: z.string().url().optional(),
    related: z.string().url().optional(),
  }).optional(),
});

// Error Response Schema (JSON:API compliant)
export const MaterialErrorResponseSchema = z.object({
  errors: z.array(z.object({
    id: z.string().optional(),
    status: z.string(),
    code: z.string(),
    title: z.string(),
    detail: z.string().optional(),
    source: z.object({
      pointer: z.string().optional(),
      parameter: z.string().optional(),
    }).optional(),
  })),
});

// State Schema for validation
export const MaterialQueryStateSchema = z.object({
  directMaterials: z.array(DirectMaterialSchema),
  indirectMaterials: z.array(IndirectMaterialSchema),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  activeTab: z.enum(['direct', 'indirect']),
  equipmentId: z.string().nullable(),
  lastUpdated: z.date().optional(),
});
