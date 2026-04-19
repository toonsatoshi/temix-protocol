import { FileTree, MutationEvent, assertUnreachable } from '@temix/types';

export class FileTreeBuilder {
  /**
   * Applies a mutation event to an existing FileTree.
   */
  static applyEvent(tree: FileTree, event: MutationEvent): FileTree {
    const { payload } = event;

    switch (payload.type) {
      case 'tact_delta':
        // FM-01: Update the file tree with the new content
        // In a real implementation, this would apply a diff.
        // For MVP, the 'delta' field contains the full new content.
        return [
          ...tree.filter((f) => f.path !== payload.path),
          { path: payload.path, content: payload.delta, hash: event.hash },
        ];

      case 'conflict_resolution':
        return [
          ...tree.filter((f) => f.path !== payload.path),
          { path: payload.path, content: payload.resolvedContent, hash: event.hash },
        ];

      case 'project_create':
      case 'jus_entry':
      case 'deployment':
      case 'rollback':
        // These don't directly mutate the file tree structure in this builder
        return tree;

      default:
        // Handle potential new payload types from @temix/types
        return tree;
    }
  }
}
