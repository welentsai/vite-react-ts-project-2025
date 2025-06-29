// src/features/material-query/components/MaterialQuery.tsx
import React from 'react';
import { Button, Card, Tabs, Typography } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMaterialQuery } from '../hooks/useMaterialQuery';
import { MaterialQueryForm, DirectMaterial, IndirectMaterial } from '../types/types';
import { MaterialQueryFormSchema } from '../types/schemas';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './material-query.css';

const { Title } = Typography;
const { TabPane } = Tabs;

export const MaterialQuery: React.FC = () => {
  const { state, handleSearch, setActiveTab, isLoading, error } = useMaterialQuery();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<MaterialQueryForm>({
    resolver: zodResolver(MaterialQueryFormSchema),
    mode: 'onChange',
    defaultValues: {
      equipmentId: '' // Ensure default value is provided
    }
  });

  // Direct Materials Grid Columns
  const directMaterialColumns: ColDef<DirectMaterial>[] = [
    { field: 'name', headerName: 'Name', filter: true, sortable: true },
    { field: 'type', headerName: 'Type', filter: true, sortable: true },
    { field: 'grade', headerName: 'Grade', filter: true, sortable: true },
    { field: 'color', headerName: 'Color', filter: true, sortable: true },
    { field: 'weight', headerName: 'Weight', filter: 'agNumberColumnFilter', sortable: true },
    { field: 'volume', headerName: 'Volume', filter: 'agNumberColumnFilter', sortable: true },
  ];

  // Indirect Materials Grid Columns
  const indirectMaterialColumns: ColDef<IndirectMaterial>[] = [
    { field: 'name', headerName: 'Name', filter: true, sortable: true },
    { field: 'category', headerName: 'Category', filter: true, sortable: true },
    { field: 'modelNumber', headerName: 'Model Number', filter: true, sortable: true },
    { field: 'costCenterCode', headerName: 'Cost Center Code', filter: true, sortable: true },
    { field: 'unitCost', headerName: 'Unit Cost', filter: 'agNumberColumnFilter', sortable: true },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <Title level={2} className="mb-6">Material Query</Title>
        
        {/* Query Form - Using only React Hook Form */}
        <Card className="mb-6 shadow-sm material-card">
          <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment ID
              </label>
              <input
                {...register('equipmentId')}
                type="text"
                placeholder="Enter Equipment ID"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.equipmentId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.equipmentId && (
                <p className="mt-1 text-sm text-red-600">{errors.equipmentId.message}</p>
              )}
            </div>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              disabled={!isValid}
            >
              Search
            </Button>
          </form>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-4 text-red-500">{error}</div>
        )}

        {/* Tabbed Material Display */}
        <Card className="shadow-sm material-card">
          <Tabs activeKey={state.activeTab} onChange={(key) => setActiveTab(key as 'direct' | 'indirect')}>
            <TabPane tab="Direct Materials" key="direct">
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact<DirectMaterial>
                  rowData={state.directMaterials}
                  columnDefs={directMaterialColumns}
                  pagination={true}
                  paginationPageSize={10}
                  animateRows={true}
                  loading={isLoading}
                />
              </div>
            </TabPane>
            <TabPane tab="Indirect Materials" key="indirect">
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact<IndirectMaterial>
                  rowData={state.indirectMaterials}
                  columnDefs={indirectMaterialColumns}
                  pagination={true}
                  paginationPageSize={10}
                  animateRows={true}
                  loading={isLoading}
                />
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};