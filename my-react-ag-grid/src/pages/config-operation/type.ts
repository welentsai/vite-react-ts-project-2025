// src/pages/ConfigOperation/types.ts

export interface SourcePartConfig {
  id?: string; // Added for ag-Grid row identification
  sourcePart: string;
  binGrade: string;
  targetPart: string;
  claimUser: string;
  claimTime: string;
}

export interface QueryFormData {
  sourcePart: string;
}

export interface ConfigOperationState {
  configs: SourcePartConfig[];
  isLoading: boolean;
  isEditing: boolean;
  selectedRows: SourcePartConfig[];
  modifiedRows: Set<string>;
  deletedRows: Set<string>;
  newRows: Set<string>;
  error: string | null;
}

export type ConfigOperationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONFIGS'; payload: SourcePartConfig[] }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_SELECTED_ROWS'; payload: SourcePartConfig[] }
  | { type: 'UPDATE_ROW'; payload: { id: string; data: SourcePartConfig } }
  | { type: 'ADD_ROW'; payload: SourcePartConfig }
  | { type: 'MARK_FOR_DELETION'; payload: string }
  | { type: 'RESET_CHANGES' }
  | { type: 'SET_ERROR'; payload: string | null };

export interface ConfigApiResponse {
  data: SourcePartConfig[];
  status: number;
  message?: string;
}

export interface ConfigSaveRequest {
  sourcePart: string;
  added: SourcePartConfig[];
  modified: SourcePartConfig[];
  deleted: string[];
}
