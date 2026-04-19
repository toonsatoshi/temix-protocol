import { JUSSchema } from './jus';
import { DeploymentRecord } from './portal';

export type ProjectStatus = 'active' | 'archived' | 'deployment_ready';

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  status: ProjectStatus;
  createdAt: number;
}

export interface FileNode {
  path: string;
  content: string;
  hash: string;
}

/**
 * FileTree is represented as a flat array of FileNodes for simplicity
 * in patching, while maintaining the 'path' as the unique identifier.
 */
export type FileTree = FileNode[];

export interface CompiledArtifact {
  bytecode: string; // hex
  abi: string; // JSON string
  boc: string; // base64 or hex
  func?: string; // intermediate FunC source
}

export interface CanonicalState {
  projectId: string;
  eventLogHead: string; // Hash of the last committed event
  fileTree: FileTree;
  artifacts: CompiledArtifact | null;
  jus: JUSSchema;
  deploymentRecords: DeploymentRecord[];
}
