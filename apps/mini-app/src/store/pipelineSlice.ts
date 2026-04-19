import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PipelineResult, IssueCard } from '@temix/types';

interface PipelineState {
  isProcessing: boolean;
  lastResult: PipelineResult | null;
  activeIssue: IssueCard | null;
  auditSessionId: string | null;
}

const initialState: PipelineState = {
  isProcessing: false,
  lastResult: null,
  activeIssue: null,
  auditSessionId: null,
};

const pipelineSlice = createSlice({
  name: 'pipeline',
  initialState,
  reducers: {
    startProcessing: (state) => {
      state.isProcessing = true;
      state.activeIssue = null;
    },
    setPipelineResult: (state, action: PayloadAction<PipelineResult>) => {
      state.isProcessing = false;
      state.lastResult = action.payload;
      
      if (action.payload.status === 'rejected') {
        state.activeIssue = action.payload.issueCard;
      } else if (action.payload.status === 'awaiting_audit') {
        state.auditSessionId = action.payload.auditSessionId;
      }
    },
    clearIssue: (state) => {
      state.activeIssue = null;
    },
    resetPipeline: (state) => {
      state.isProcessing = false;
      state.lastResult = null;
      state.activeIssue = null;
      state.auditSessionId = null;
    },
  },
});

export const { 
  startProcessing, 
  setPipelineResult, 
  clearIssue, 
  resetPipeline 
} = pipelineSlice.actions;

export default pipelineSlice.reducer;
