// src/pages/ConfigOperation/ConfigOperation.tsx

import { DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { Button, Card, Form, Input, Modal, Space, Typography } from 'antd';
import React, { useCallback, useMemo } from 'react';
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
  const onFinish = useCallback(
    (values: QueryFormData) => {
      handleSearch(values);
    },
    [handleSearch]
  );

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // Handle selection change
  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      const selectedRows = event.api.getSelectedRows();
      handleSelectionChange(selectedRows);
    },
    [handleSelectionChange]
  );

  // Handle cell value change
  const onCellValueChanged = useCallback(
    (params: any) => {
      const { data, node } = params;
      if (data.id) {
        handleRowUpdate(data.id, data);
      }
    },
    [handleRowUpdate]
  );

  // Get row style based on row state
  const getRowStyle = useCallback(
    (params: any) => {
      const { data } = params;
      if (!data.id) return {};

      if (state.deletedRows.has(data.id)) {
        return { background: '#ffebee' }; // Light red
      }
      if (state.newRows.has(data.id)) {
        return { background: '#e8f5e8' }; // Light green
      }
      if (state.modifiedRows.has(data.id)) {
        return { background: '#fff8e1' }; // Light yellow
      }
      // return {};
    },
    [state.deletedRows, state.newRows, state.modifiedRows]
  );

  // Column definitions
  const columnDefs: ColDef[] = useMemo(
    () => [
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
        valueFormatter: params => {
          if (params.value) {
            return new Date(params.value).toLocaleString();
          }
          return '';
        },
      },
    ],
    [state.isEditing]
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

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
      <div className="max-w-7xl mx-auto">
        <Title level={2} className="mb-6">
          Config Operation
        </Title>

        {/* Query Form */}
        <Card className="mb-6 shadow-sm">
          <Form form={form} layout="inline" onFinish={onFinish} className="flex items-center gap-4">
            <Form.Item
              name="sourcePart"
              label="Source Part"
              rules={[{ required: true, message: 'Please enter Source Part' }]}
              className="flex-1 max-w-md"
            >
              <Input placeholder="Enter Source Part" className="w-full" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
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
              <div className="flex justify-between items-center">
                <span>Configuration List</span>
                <Space>
                  {!state.isEditing ? (
                    <Button
                      icon={<EditOutlined />}
                      onClick={handleEditToggle}
                      className="border-blue-500 text-blue-500 hover:bg-blue-50"
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
                        className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                      >
                        Save
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            }
          >
            <div className="ag-theme-alpine w-full h-96">
              <AgGridReact
                rowData={state.configs}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowHoverHighlight={true}
                // suppressRowClickSelection={!state.isEditing}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                onCellValueChanged={onCellValueChanged}
                getRowStyle={getRowStyle}
                animateRows={true}
                enableCellTextSelection={true}
                domLayout="normal"
              />
            </div>
          </Card>
        )}

        {/* No Data State */}
        {state.configs.length === 0 && !isLoading && (
          <Card className="text-center py-12 shadow-sm">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No configurations found</p>
              <p>Enter a Source Part and click Search to view configurations</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConfigOperation;
