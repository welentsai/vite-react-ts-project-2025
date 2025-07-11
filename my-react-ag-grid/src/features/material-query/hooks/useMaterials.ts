// src/features/material-query/hooks/useMaterials.ts
import { useQuery } from '@tanstack/react-query';
import { materialService } from '../services/material.service';
import { MaterialQueryFormSchema } from '../types/schemas';
import { MaterialResponse } from '../types/types';

export const useMaterials = (equipmentId?: string) => {
  return useQuery({
    queryKey: ['materials', equipmentId],
    queryFn: async (): Promise<MaterialResponse['data']> => {
      if (!equipmentId) {
        throw new Error('Equipment ID is required');
      }

      // Validate input with Zod
      const validatedInput = MaterialQueryFormSchema.parse({ equipmentId });

      return materialService.getMaterialsByEquipmentId({
        equipmentId: validatedInput.equipmentId,
      });
    },
    enabled: !!equipmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (error.message.includes('Validation error')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
