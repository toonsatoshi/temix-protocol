import { JUSSchema } from './jus';

export interface FileEntry {
  path: string;
  content: string;
}

export type FileTree = FileEntry[];

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface CanonicalState {
  projectId: string;
  eventLogHead: string;
  files: FileTree;
  jus: JUSSchema;
}
