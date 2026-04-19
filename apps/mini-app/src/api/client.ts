import axios from 'axios';
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
  getProjects: () => client.get<Project[]>('/projects'),
  getProjectState: (projectId: string) => client.get<CanonicalState>(`/projects/${projectId}/state`),
  getProjectTimeline: (projectId: string) => client.get(`/projects/${projectId}/timeline`),
  getProjectManifest: (projectId: string) => client.get<PortalManifest>(`/projects/${projectId}/manifest`),
  rollbackProject: (projectId: string, eventHash: string) => 
    client.post(`/projects/${projectId}/rollback`, { eventHash }),

  // Pipeline
  submitPipeline: (input: PipelineInput) => 
    client.post<PipelineResult>('/pipeline/submit', input),

  // Events
  getEvents: (projectId: string, params?: { cursor?: string; limit?: number }) => 
    client.get<MutationEvent[]>(`/projects/${projectId}/events`, { params }),

  // Deployment
  deployProject: (projectId: string) => client.post(`/projects/${projectId}/deploy`),
  instantiatePortal: (projectId: string) => client.post(`/projects/${projectId}/portal/instantiate`),
};

export default client;
