import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './projectSlice';
import pipelineReducer from './pipelineSlice';

export const store = configureStore({
  reducer: {
    project: projectReducer,
    pipeline: pipelineReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
