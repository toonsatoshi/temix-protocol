import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanonicalState, Project } from '@temix/types';

interface ProjectState {
  currentProject: Project | null;
  canonicalState: CanonicalState | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  currentProject: null,
  canonicalState: null,
  projects: [],
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
    setCurrentProject: (state, action: PayloadAction<Project>) => {
      state.currentProject = action.payload;
    },
    setCanonicalState: (state, action: PayloadAction<CanonicalState>) => {
      state.canonicalState = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateStateIncremental: (state, action: PayloadAction<Partial<CanonicalState>>) => {
      if (state.canonicalState) {
        state.canonicalState = { ...state.canonicalState, ...action.payload };
      }
    },
  },
});

export const { 
  setProjects, 
  setCurrentProject, 
  setCanonicalState, 
  setLoading, 
  setError,
  updateStateIncremental 
} = projectSlice.actions;

export default projectSlice.reducer;
