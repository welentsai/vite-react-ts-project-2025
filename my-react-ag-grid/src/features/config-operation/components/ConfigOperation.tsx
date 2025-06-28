// src/pages/ConfigOperation/ConfigOperation.tsx

import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  ImportOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  SelectionChangedEvent,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { Button, Card, Form, Input, Modal, Space, Typography, Upload } from 'antd';
import React, { useCallback, useMemo } from 'react';
import './ag-grid-custom.css';
import { useConfigOperation } from '../hooks/hook';
import { QueryFormData, SourcePartConfig } from '../types/types';

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
    handleDiscard,
    handleImport,
    handleExport,
    handleDownloadTemplate,
  } = useConfigOperation();

  const [form] = Form.useForm<QueryFormData>();

  // Grid API reference
  const [, setGridApi] = React.useState<GridApi | null>(null);

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
    (params: CellValueChangedEvent<SourcePartConfig>) => {
      const { data } = params;
      if (data.id) {
        handleRowUpdate(data.id, data);
      }
    },
    [handleRowUpdate]
  );

  // Handle import file
  const handleImportFile = useCallback(
    (file: File) => {
      return handleImport(file);
    },
    [handleImport]
  );

  // Row class rules for styling based on row state
  const rowClassRules = useMemo(
    () => ({
      'row-deleted': (params: RowClassParams) => {
        return params.data?.id && state.deletedRows.has(params.data.id);
      },
      'row-new': (params: RowClassParams) => {
        return params.data?.id && state.newRows.has(params.data.id);
      },
      'row-modified': (params: RowClassParams) => {
        return (
          params.data?.id &&
          state.modifiedRows.has(params.data.id) &&
          !state.newRows.has(params.data.id)
        );
      },
    }),
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
        // headerCheckboxSelection: state.isEditing,
        // checkboxSelection: state.isEditing,
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

  // Render action buttons based on edit mode
  const renderActionButtons = () => {
    if (!state.isEditing) {
      return (
        <Space>
          {state.configs.length > 0 && (
            <Button
              icon={<EditOutlined />}
              onClick={handleEditToggle}
              className="border-primary-500 text-primary-500 hover:bg-primary-50"
            >
              Edit
            </Button>
          )}

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            className="border-purple-500 text-purple-500 hover:bg-purple-50"
            title="Download Excel template"
          >
            Template
          </Button>

          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImportFile}
            className="inline-block"
          >
            <Button
              icon={<ImportOutlined />}
              loading={isLoading}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Import
            </Button>
          </Upload>

          {state.configs.length > 0 && (
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Export
            </Button>
          )}
        </Space>
      );
    }

    return (
      <Space>
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

        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={handleImportFile}
          className="inline-block"
        >
          <Button
            icon={<ImportOutlined />}
            loading={isLoading}
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            Import
          </Button>
        </Upload>

        <Button
          icon={<ExportOutlined />}
          onClick={handleExport}
          disabled={state.configs.length === 0}
          className="border-orange-500 text-orange-500 hover:bg-orange-50 disabled:border-gray-300 disabled:text-gray-400"
        >
          Export
        </Button>

        <Button
          icon={<CloseOutlined />}
          onClick={handleDiscard}
          className="border-gray-500 text-gray-500 hover:bg-gray-50"
        >
          Discard
        </Button>
      </Space>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl">
        <Title level={2} className="mb-6">
          Config Operation
        </Title>

        {/* Query Form */}
        <Card className="mb-6 shadow-sm config-card">
          <Form form={form} layout="inline" onFinish={onFinish} className="flex items-center gap-4">
            <Form.Item
              name="sourcePart"
              label="Source Part"
              rules={[{ required: true, message: 'Please enter Source Part' }]}
              className="max-w-md flex-1"
            >
              <Input placeholder="Enter Source Part" className="w-full" />
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

        {/* Data Grid - Always visible */}
        <Card
          className="shadow-sm config-card"
          title={
            <div className="flex items-center justify-between">
              <span>Configuration List</span>
              {renderActionButtons()}
            </div>
          }
        >
          <div className="ag-theme-alpine h-96 w-full">
            <AgGridReact
              rowData={state.configs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              onCellValueChanged={onCellValueChanged}
              rowSelection={{ mode: 'singleRow' }}
              rowClassRules={rowClassRules}
              animateRows={true}
              enableCellTextSelection={true}
              domLayout="normal"
              loading={isLoading}
              overlayLoadingTemplate="<span class='ag-overlay-loading-center'>Loading...</span>"
              overlayNoRowsTemplate={`
                <div class='ag-overlay-no-rows-center' style='padding: 20px; text-align: center;'>
                  <div style='color: #6b7280; font-size: 16px; margin-bottom: 8px;'>No configurations found</div>
                  <div style='color: #9ca3af; font-size: 14px;'>
                    ${
                      state.configs.length === 0 && !state.isEditing
                        ? 'Search for configurations or import data from Excel'
                        : 'No data to display'
                    }
                  </div>
                </div>
              `}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ConfigOperation;
