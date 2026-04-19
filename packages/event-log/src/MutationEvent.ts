import * as crypto from 'crypto';
import { MutationEvent, MutationPayload } from '@temix/types';
import { canonicalSerialize } from './serializer';
import { v4 as uuidv4 } from 'uuid';

export class MutationEventBuilder {
  /**
   * Builds a new MutationEvent with a cryptographically linked hash.
   * Hash = SHA-256( canonical_serialize(payload) + prevHash )
   */
  static build(
    projectId: string,
    payload: MutationPayload,
    prevHash: string = 'genesis'
  ): MutationEvent {
    const serializedPayload = canonicalSerialize(payload);
    const hash = crypto
      .createHash('sha256')
      .update(serializedPayload + prevHash)
      .digest('hex');

    return {
      id: uuidv4(),
      projectId,
      hash,
      prevHash,
      payload,
      status: 'committed',
      timestamp: Date.now(),
    };
  }

  /**
   * Verifies the hash integrity of an event.
   */
  static verify(event: MutationEvent): boolean {
    const serializedPayload = canonicalSerialize(event.payload);
    const expectedHash = crypto
      .createHash('sha256')
      .update(serializedPayload + event.prevHash)
      .digest('hex');
    
    return event.hash === expectedHash;
  }
}
