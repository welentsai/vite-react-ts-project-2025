// src/mocks/handlers/materialQueryHandlers.ts
import { http, HttpResponse } from 'msw';
import { MaterialResponse } from '../../features/material-query/types/types';

export const materialQueryHandlers = [
  http.get('https://abc.example.com/api/configs', ({ request }) => {
    const url = new URL(request.url);
    const equipmentId = url.searchParams.get('equipmentId');
    
    if (!equipmentId) {
      return HttpResponse.json(
        { error: 'Equipment ID is required' },
        { status: 400 }
      );
    }

    const mockResponse: MaterialResponse = {
      data: {
        directMaterials: [
          {
            id: 'DM1',
            name: 'Steel Plate',
            type: 'Metal',
            grade: 'A36',
            color: 'Gray',
            weight: 100,
            volume: 0.5
          },
          {
            id: 'DM2',
            name: 'Aluminum Sheet',
            type: 'Metal',
            grade: '6061',
            color: 'Silver',
            weight: 50,
            volume: 0.3
          },
          {
            id: 'DM3',
            name: 'Copper Wire',
            type: 'Metal',
            grade: 'C110',
            color: 'Copper',
            weight: 10,
            volume: 0.1
          }
        ],
        indirectMaterials: [
          {
            id: 'IM1',
            name: 'Lubricant Oil',
            category: 'Consumable',
            modelNumber: 'LUB-100',
            costCenterCode: 'CC-001',
            unitCost: 25.5
          },
          {
            id: 'IM2',
            name: 'Cleaning Solvent',
            category: 'Consumable',
            modelNumber: 'SOL-200',
            costCenterCode: 'CC-002',
            unitCost: 15.75
          },
          {
            id: 'IM3',
            name: 'Safety Gloves',
            category: 'PPE',
            modelNumber: 'GLV-300',
            costCenterCode: 'CC-003',
            unitCost: 8.99
          }
        ]
      }
    };

    return HttpResponse.json(
      mockResponse,
      { status: 200 }
    );
  }),
];
