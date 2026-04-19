import { CanonicalState, MutationEvent, assertUnreachable } from '@temix/types';
import { MutationEventBuilder } from './MutationEvent';

export class Replayer {
  /**
   * Replays an event stream to produce the final CanonicalState.
   * Also verifies hash chain integrity during replay.
   */
  static async replay(
    projectId: string,
    events: AsyncIterable<MutationEvent>
  ): Promise<CanonicalState> {
    let state: CanonicalState = {
      projectId,
      eventLogHead: 'genesis',
      fileTree: [],
      artifacts: null,
      jus: { entries: {} },
      deploymentRecords: [],
    };

    let lastHash = 'genesis';

    for await (const event of events) {
      // FM-01 & Scenario 6: Gap in hash chain detection
      if (event.prevHash !== lastHash) {
        throw new Error(
          `Hash chain divergence detected at event ${event.id}. Expected prevHash ${lastHash}, got ${event.prevHash}`
        );
      }

      // Verify individual event hash
      if (!MutationEventBuilder.verify(event)) {
        throw new Error(`Invalid hash detected for event ${event.id}`);
      }

      state = this.applyEvent(state, event);
      lastHash = event.hash;
    }

    state.eventLogHead = lastHash;
    return state;
  }

  /**
   * Pure function to apply a single event to a state.
   */
  static applyEvent(state: CanonicalState, event: MutationEvent): CanonicalState {
    const { payload } = event;

    switch (payload.type) {
      case 'project_create':
        // Initialization already handled or project metadata updated here
        return state;

      case 'tact_delta':
        // In a real implementation, this would involve patching the file tree.
        // For Phase 1/2, we represent the principle.
        return {
          ...state,
          fileTree: [
            ...state.fileTree.filter((f) => f.path !== payload.path),
            { path: payload.path, content: payload.delta, hash: event.hash },
          ],
        };

      case 'jus_entry':
        return {
          ...state,
          jus: {
            ...state.jus,
            entries: {
              ...state.jus.entries,
              [payload.entry.opcode]: payload.entry,
            },
          },
        };

      case 'conflict_resolution':
        return {
          ...state,
          fileTree: [
            ...state.fileTree.filter((f) => f.path !== payload.path),
            { path: payload.path, content: payload.resolvedContent, hash: event.hash },
          ],
        };

      case 'deployment':
        return {
          ...state,
          deploymentRecords: [...state.deploymentRecords, payload.record],
        };

      case 'rollback':
        // Rollback is handled by the EventLog during replay (it only yields events up to target)
        // or by a special event that contains the full state.
        // For MVP, replay is the rollback mechanism.
        return state;

      case 'batch':
        let batchState = state;
        for (const subPayload of payload.events) {
          batchState = this.applyEvent(batchState, { ...event, payload: subPayload });
        }
        return batchState;

      default:
        return assertUnreachable(payload);
    }
  }
}
