import axios from 'axios';
import { createClient } from '@base44/sdk';
import { 
  PipelineInput, 
  PipelineResult, 
  CanonicalState, 
  Project,
  PortalManifest,
  MutationEvent
} from '@temix/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const db = createClient({
  serverUrl: "https://portal-sync-flow.base44.app",
  appId: "69e4caf5b64af20598be0dbf",
  headers: { "api_key": "6cb91abc013247618da69247a4b7e68f" }
});

const entities = db.asServiceRole.entities;

// Interceptor to add Telegram InitData to headers
client.interceptors.request.use((config) => {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initData) {
    config.headers['Authorization'] = `Bearer ${tg.initData}`;
  }
  return config;
});

export const api = {
  // Projects
  getProjects: async () => {
    return entities.Project.list();
  },
  getProjectState: async (projectId: string) => {
    const states = await entities.CanonicalState.filter(
      { projectId },
      '-created_date',
      1
    );
    return states[0] as CanonicalState;
  },
  getProjectTimeline: (projectId: string) => client.get(`/projects/${projectId}/timeline`),
  getProjectManifest: (projectId: string) => client.get<PortalManifest>(`/projects/${projectId}/manifest`),
  rollbackProject: (projectId: string, eventHash: string) =>
    client.post(`/projects/${projectId}/rollback`, { eventHash }),

  // Pipeline
  submitPipeline: (input: PipelineInput) =>
    client.post<PipelineResult>('/pipeline/submit', input),

  // Events
  getEvents: async (projectId: string, params?: { cursor?: string; limit?: number }) => {
     return entities.MutationEvent.filter(
       { projectId, status: 'committed' },
       '-created_date',
       params?.limit || 50
     );
  },
  // Deployment
  deployProject: (projectId: string) => client.post(`/projects/${projectId}/deploy`),
  instantiatePortal: (projectId: string) => client.post(`/projects/${projectId}/portal/instantiate`),

  // Polling helper
  pollProjectState: (projectId: string, callback: (state: CanonicalState) => void) => {
    const interval = setInterval(async () => {
      try {
        const state = await api.getProjectState(projectId);
        if (state) callback(state);
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }
};

export default client;
