import * as fs from 'fs';
import * as path from 'path';
import { CanonicalState, MutationEvent } from '@temix/types';
import { Replayer } from '@temix/event-log';

export class Materializer {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * Translates the event log into the canonical file tree and compiled artifacts (FM-01).
   */
  async materialize(projectId: string, events: AsyncIterable<MutationEvent>): Promise<CanonicalState> {
    // 1. Replay the Log to get the canonical state
    const state = await Replayer.replay(projectId, events);

    // 2. Apply to Physical File System
    await this.syncToFileSystem(state);

    return state;
  }

  /**
   * Ensures that "Reality" (the files) matches the "Source of Truth" (the log).
   */
  private async syncToFileSystem(state: CanonicalState): Promise<void> {
    // For each file in the materialized state, write it to disk.
    // In a multi-project system, this would be scoped to a project directory.
    const projectRoot = path.join(this.baseDir, 'projects', state.projectId);

    // Ensure directory exists
    if (!fs.existsSync(projectRoot)) {
      fs.mkdirSync(projectRoot, { recursive: true });
    }

    for (const node of state.fileTree) {
      const filePath = path.join(projectRoot, node.path);
      const dirPath = path.dirname(filePath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Write the content
      fs.writeFileSync(filePath, node.content);
    }

    // Write JUS schema if present
    if (Object.keys(state.jus.entries).length > 0) {
      const jusPath = path.join(projectRoot, '.jus.json');
      fs.writeFileSync(jusPath, JSON.stringify(state.jus, null, 2));
    }
  }
}
