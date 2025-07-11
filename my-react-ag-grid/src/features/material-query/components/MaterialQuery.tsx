// src/features/material-query/components/MaterialQuery.tsx
import { SearchOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { Button, Card, Empty, Spin, Tabs, Typography } from 'antd';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMaterialQuery } from '../hooks/useMaterialQuery';
import { MaterialQueryFormSchema } from '../types/schemas';
import { DirectMaterial, IndirectMaterial, MaterialQueryForm } from '../types/types';
import './material-query.css';

const { Title, Text } = Typography;
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
      equipmentId: '', // Ensure default value is provided
    },
  });

  // Direct Materials Grid Columns
  const directMaterialColumns: ColDef<DirectMaterial>[] = [
    { field: 'name', headerName: 'Name', filter: true, sortable: true, minWidth: 150 },
    { field: 'type', headerName: 'Type', filter: true, sortable: true, minWidth: 120 },
    { field: 'grade', headerName: 'Grade', filter: true, sortable: true, minWidth: 120 },
    { field: 'color', headerName: 'Color', filter: true, sortable: true, minWidth: 120 },
    {
      field: 'weight',
      headerName: 'Weight',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 120,
      valueFormatter: params => `${params.value.toFixed(2)} kg`,
    },
    {
      field: 'volume',
      headerName: 'Volume',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 120,
      valueFormatter: params => `${params.value.toFixed(2)} m³`,
    },
  ];

  // Indirect Materials Grid Columns
  const indirectMaterialColumns: ColDef<IndirectMaterial>[] = [
    { field: 'name', headerName: 'Name', filter: true, sortable: true, minWidth: 150 },
    { field: 'category', headerName: 'Category', filter: true, sortable: true, minWidth: 150 },
    {
      field: 'modelNumber',
      headerName: 'Model Number',
      filter: true,
      sortable: true,
      minWidth: 150,
    },
    {
      field: 'costCenterCode',
      headerName: 'Cost Center Code',
      filter: true,
      sortable: true,
      minWidth: 150,
    },
    {
      field: 'unitCost',
      headerName: 'Unit Cost',
      filter: 'agNumberColumnFilter',
      sortable: true,
      minWidth: 120,
      valueFormatter: params => `$${params.value.toFixed(2)}`,
    },
  ];

  const renderEmptyState = (type: string) => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          No {type} Materials Found.{' '}
          {state.equipmentId ? (
            <span>Try a different Equipment ID.</span>
          ) : (
            <span>Enter an Equipment ID to search for materials.</span>
          )}
        </span>
      }
    />
  );

  const loadingOverlay = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">
      <div class="ant-spin ant-spin-lg ant-spin-spinning">
        <span class="ant-spin-dot">
          <i class="ant-spin-dot-item"></i>
          <i class="ant-spin-dot-item"></i>
          <i class="ant-spin-dot-item"></i>
          <i class="ant-spin-dot-item"></i>
        </span>
      </div>
      <div style="margin-top: 16px; font-size: 14px; color: rgba(0,0,0,0.65);">Loading materials data...</div>
    </div>
  `;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <Title level={2} className="mb-6">
          Material Query
        </Title>

        {/* Query Form */}
        <Card
          className="mb-6 shadow-sm material-card"
          title={<span className="font-medium text-lg">Search by Equipment ID</span>}
        >
          <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID</label>
              <input
                {...register('equipmentId')}
                type="text"
                placeholder="Enter Equipment ID (e.g., EQP-1234)"
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
              icon={<SearchOutlined />}
            >
              Search Materials
            </Button>
          </form>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <Text strong className="block mb-1">
              Error Occurred
            </Text>
            <Text>{error}</Text>
            <div className="mt-2">
              <Text>Please try again or contact support if the issue persists.</Text>
            </div>
          </div>
        )}

        {/* Tabbed Material Display */}
        <Card
          className="shadow-sm results-card"
          title={<span className="font-medium text-lg">Material Results</span>}
        >
          <Tabs
            activeKey={state.activeTab}
            onChange={key => setActiveTab(key as 'direct' | 'indirect')}
          >
            <TabPane tab="Direct Materials" key="direct">
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                {isLoading ? (
                  <Spin tip="Loading materials..." size="large" style={{ marginTop: 100 }}>
                    <div style={{ height: 300 }} />
                  </Spin>
                ) : state.directMaterials.length === 0 ? (
                  renderEmptyState('Direct')
                ) : (
                  <AgGridReact<DirectMaterial>
                    rowData={state.directMaterials}
                    columnDefs={directMaterialColumns}
                    pagination={true}
                    paginationPageSize={10}
                    animateRows={true}
                    loading={isLoading}
                    overlayLoadingTemplate={loadingOverlay}
                    overlayNoRowsTemplate={renderEmptyState('Direct').toString()}
                  />
                )}
              </div>
            </TabPane>
            <TabPane tab="Indirect Materials" key="indirect">
              <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                {isLoading ? (
                  <Spin tip="Loading materials..." size="large" style={{ marginTop: 100 }}>
                    <div style={{ height: 300 }} />
                  </Spin>
                ) : state.indirectMaterials.length === 0 ? (
                  renderEmptyState('Indirect')
                ) : (
                  <AgGridReact<IndirectMaterial>
                    rowData={state.indirectMaterials}
                    columnDefs={indirectMaterialColumns}
                    pagination={true}
                    paginationPageSize={10}
                    animateRows={true}
                    loading={isLoading}
                    overlayLoadingTemplate={loadingOverlay}
                    overlayNoRowsTemplate={renderEmptyState('Indirect').toString()}
                  />
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
