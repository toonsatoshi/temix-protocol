import { entities } from '@temix/db';
import { MutationEvent, MutationPayload, RejectionPayload } from '@temix/types';
import { MutationEventBuilder } from './MutationEvent';
import { v4 as uuidv4 } from 'uuid';

export class EventLog {
  /**
   * Appends a new payload to the project's event log.
   * This is the only legitimate entry point for state mutation.
   */
  static async append(
    projectId: string,
    payload: MutationPayload
  ): Promise<MutationEvent> {
    const head = await this.getHead(projectId);
    const prevHash = head ? head.hash : 'genesis';

    const event = MutationEventBuilder.build(projectId, payload, prevHash);

    const record = await entities.MutationEvent.create({
      id: event.id,
      projectId: event.projectId,
      hash: event.hash,
      prevHash: event.prevHash,
      payload: event.payload,
      status: 'committed',
      timestamp: event.timestamp,
    });

    return this.mapRecordToEvent(record);
  }

  /**
   * Records a rejected attempt in the log without mutating canonical state.
   */
  static async reject(
    projectId: string,
    payload: MutationPayload,
    reason: string
  ): Promise<void> {
    const rejection: RejectionPayload = {
      type: 'rejection',
      originalPayload: payload,
      reason
    };
    
    await entities.MutationEvent.create({
      id: uuidv4(),
      projectId,
      hash: `rejected-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      prevHash: 'none',
      payload: rejection,
      status: 'rejected',
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieves the most recent committed event for a project.
   */
  static async getHead(projectId: string): Promise<MutationEvent | null> {
    const records = await entities.MutationEvent.filter(
      { projectId, status: 'committed' },
      '-created_date',
      1
    );

    return records.length > 0 ? this.mapRecordToEvent(records[0]) : null;
  }

  /**
   * Streams all committed events for a project in chronological order.
   */
  static async *replay(projectId: string): AsyncIterable<MutationEvent> {
    const records = await entities.MutationEvent.filter(
      { projectId, status: 'committed' },
      'created_date'
    );

    for (const record of records) {
      yield this.mapRecordToEvent(record);
    }
  }

  private static mapRecordToEvent(record: any): MutationEvent {
    return {
      id: record.id,
      projectId: record.projectId,
      hash: record.hash,
      prevHash: record.prevHash,
      payload: record.payload as unknown as MutationPayload,
      status: record.status as any,
      timestamp: Number(record.timestamp),
    };
  }
}
