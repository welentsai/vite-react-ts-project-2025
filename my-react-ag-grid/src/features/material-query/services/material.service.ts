// src/features/material-query/services/material.service.ts
import axios, { AxiosResponse } from 'axios';
import { MaterialQueryFormSchema, MaterialResponseSchema } from '../types/schemas';
import { GetMaterialsRequest, MaterialResponse } from '../types/types';
import { parseApiError, transformApiResponse } from '../utils/validation';

class MaterialService {
  private api = axios.create({
    baseURL: 'https://abc.example.com/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
  });

  async getMaterialsByEquipmentId(request: GetMaterialsRequest): Promise<MaterialResponse['data']> {
    try {
      // Validate input
      const validatedRequest = MaterialQueryFormSchema.parse({ equipmentId: request.equipmentId });

      // Make API call
      const response: AxiosResponse = await this.api.get('/configs', {
        params: { equipmentId: validatedRequest.equipmentId },
      });

      // Validate and transform response
      const validatedData = transformApiResponse(response.data);

      if (!validatedData) {
        throw new Error('Invalid response format from server');
      }

      return validatedData;
    } catch (error) {
      // Enhanced error handling with Zod
      throw new Error(parseApiError(error));
    }
  }

  // Utility method for validating individual materials
  validateMaterials(data: MaterialResponse['data']): boolean {
    try {
      // Validate each direct material
      data.directMaterials.forEach(material => {
        const result = MaterialResponseSchema.safeParse({
          data: { directMaterials: [material], indirectMaterials: [] },
        });
        if (!result.success) {
          throw new Error(`Invalid direct material: ${parseApiError(result.error)}`);
        }
      });

      // Validate each indirect material
      data.indirectMaterials.forEach(material => {
        const result = MaterialResponseSchema.safeParse({
          data: { directMaterials: [], indirectMaterials: [material] },
        });
        if (!result.success) {
          throw new Error(`Invalid indirect material: ${parseApiError(result.error)}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Material validation failed:', error);
      return false;
    }
  }
}

export const materialService = new MaterialService();
