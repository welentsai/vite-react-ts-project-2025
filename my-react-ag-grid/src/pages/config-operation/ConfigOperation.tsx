// src/pages/ConfigOperation/ConfigOperation.tsx

import React, { useMemo, useCallback } from 'react';
import { Form, Input, Button, Card, Space, Modal, Typography } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { EditOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/styles/ag-grid-custom.css';
import { useConfigOperation } from './hook';
import { QueryFormData } from './type';

const { Title } = Typography;

const ConfigOperation: React.FC = () => {
  const {
    state,
    isLoading,
    isSaving,
    handleSearch,
    handleEditToggle,
    handleRowUpdate,
    handleAddRow,
    handleDeleteRow,
    handleSave,
    handleSelectionChange,
  } = useConfigOperation();

  const [form] = Form.useForm<QueryFormData>();

  // Grid API reference
  const [gridApi, setGridApi] = React.useState<GridApi | null>(null);

  // Handle form submission
  const onFinish = useCallback((values: QueryFormData) => {
    handleSearch(values);
  }, [handleSearch]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // Handle selection change
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedRows = event.api.getSelectedRows();
    handleSelectionChange(selectedRows);
  }, [handleSelectionChange]);

  // Handle cell value change
  const onCellValueChanged = useCallback((params: any) => {
    const { data, node } = params;
    if (data.id) {
      handleRowUpdate(data.id, data);
    }
  }, [handleRowUpdate]);

  // Row class rules for styling based on row state
  const rowClassRules = useMemo(() => ({
    'row-deleted': (params: any) => {
      return params.data?.id && state.deletedRows.has(params.data.id);
    },
    'row-new': (params: any) => {
      return params.data?.id && state.newRows.has(params.data.id);
    },
    'row-modified': (params: any) => {
      return params.data?.id && state.modifiedRows.has(params.data.id) && !state.newRows.has(params.data.id);
    },
  }), [state.deletedRows, state.newRows, state.modifiedRows]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'sourcePart',
      headerName: 'Source Part',
      editable: state.isEditing,
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'binGrade',
      headerName: 'Bin Grade',
      editable: state.isEditing,
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'targetPart',
      headerName: 'Target Part',
      editable: state.isEditing,
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'claimUser',
      headerName: 'Claim User',
      editable: false,
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'claimTime',
      headerName: 'Claim Time',
      editable: false,
      flex: 1,
      minWidth: 180,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return '';
      },
    },
  ], [state.isEditing]);

  // Default column properties
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  // Show error modal
  const showErrorModal = useCallback(() => {
    if (state.error) {
      Modal.error({
        title: 'Error',
        content: state.error,
        onOk: () => {
          // Clear error after showing
        },
      });
    }
  }, [state.error]);

  // Effect to show error modal
  React.useEffect(() => {
    showErrorModal();
  }, [showErrorModal]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <Title level={2} className="mb-6">Config Operation</Title>
        
        {/* Query Form */}
        <Card className="mb-6 shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={onFinish}
            className="flex items-center gap-4"
          >
            <Form.Item
              name="sourcePart"
              label="Source Part"
              rules={[{ required: true, message: 'Please enter Source Part' }]}
              className="max-w-md flex-1"
            >
              <Input 
                placeholder="Enter Source Part"
                className="w-full"
              />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                className="border-primary-500 bg-primary-500 hover:border-primary-600 hover:bg-primary-600"
              >
                Search
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Data Grid */}
        {state.configs.length > 0 && (
          <Card 
            className="shadow-sm"
            title={
              <div className="flex items-center justify-between">
                <span>Configuration List</span>
                <Space>
                  {!state.isEditing ? (
                    <Button 
                      icon={<EditOutlined />}
                      onClick={handleEditToggle}
                      className="border-primary-500 text-primary-500 hover:bg-primary-50"
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button 
                        icon={<PlusOutlined />}
                        onClick={handleAddRow}
                        className="border-green-500 text-green-500 hover:bg-green-50"
                      >
                        Add
                      </Button>
                      <Button 
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteRow}
                        disabled={state.selectedRows.length === 0}
                        className="border-red-500 text-red-500 hover:bg-red-50 disabled:border-gray-300 disabled:text-gray-400"
                      >
                        Delete
                      </Button>
                      <Button 
                        icon={<SaveOutlined />}
                        type="primary"
                        onClick={handleSave}
                        loading={isSaving}
                        className="border-primary-500 bg-primary-500 hover:border-primary-600 hover:bg-primary-600"
                      >
                        Save
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            }
          >
            <div className="ag-theme-alpine h-96 w-full">
              <AgGridReact
                rowData={state.configs}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowClickSelection={!state.isEditing}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                rowClassRules={rowClassRules}
                animateRows={true}
                enableCellTextSelection={true}
                domLayout="normal"
              />
            </div>
          </Card>
        )}

        {/* No Data State */}
        {state.configs.length === 0 && !isLoading && (
          <Card className="py-12 text-center shadow-sm">
            <div className="text-gray-500">
              <p className="mb-2 text-lg">No configurations found</p>
              <p>Enter a Source Part and click Search to view configurations</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConfigOperation;