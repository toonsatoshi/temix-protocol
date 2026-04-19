import { MutationEventBuilder } from '../src/MutationEvent';
import { canonicalSerialize } from '../src/serializer';
import { Replayer } from '../src/replayer';
import { MutationPayload, MutationEvent, CanonicalState } from '@temix/types';

describe('EventLog / MutationEvent / Serializer', () => {
  
  // Scenario 3: Two payloads that are structurally identical but property-insertion-ordered 
  // differently produce identical serializations
  test('Scenario 3: Canonical Serialization Determinism', () => {
    const payload1: any = { type: 'tact_delta', path: 'main.tact', delta: '+hello' };
    const payload2: any = { delta: '+hello', path: 'main.tact', type: 'tact_delta' };
    
    expect(canonicalSerialize(payload1)).toBe(canonicalSerialize(payload2));
    expect(Object.keys(JSON.parse(canonicalSerialize(payload1)))[0]).toBe('delta'); // 'd' before 'p'
  });

  // Scenario 1: Genesis event creation (prevHash = "genesis")
  test('Scenario 1: Genesis Event Creation', () => {
    const payload: MutationPayload = { type: 'project_create', name: 'Test', ownerId: 'user1' };
    const event = MutationEventBuilder.build('proj1', payload);
    
    expect(event.prevHash).toBe('genesis');
    expect(MutationEventBuilder.verify(event)).toBe(true);
  });

  // Scenario 2: Subsequent event correctly references predecessor hash
  test('Scenario 2: Hash Chain Linking', () => {
    const p1: MutationPayload = { type: 'project_create', name: 'Test', ownerId: 'user1' };
    const e1 = MutationEventBuilder.build('proj1', p1);
    
    const p2: MutationPayload = { type: 'tact_delta', path: 'main.tact', delta: '+line' };
    const e2 = MutationEventBuilder.build('proj1', p2, e1.hash);
    
    expect(e2.prevHash).toBe(e1.hash);
    expect(MutationEventBuilder.verify(e2)).toBe(true);
  });

  // Scenario 4: A replay of N events produces the same CanonicalState as N incremental apply() calls
  test('Scenario 4: Incremental vs Replay Consistency', async () => {
    const p1: MutationPayload = { type: 'project_create', name: 'Test', ownerId: 'user1' };
    const e1 = MutationEventBuilder.build('proj1', p1);
    const p2: MutationPayload = { type: 'tact_delta', path: 'main.tact', delta: 'v1' };
    const e2 = MutationEventBuilder.build('proj1', p2, e1.hash);
    
    // Incremental
    let stateInc: CanonicalState = {
        projectId: 'proj1',
        eventLogHead: 'genesis',
        fileTree: [],
        artifacts: null,
        jus: { entries: {} },
        deploymentRecords: [],
    };
    stateInc = Replayer.applyEvent(stateInc, e1);
    stateInc = Replayer.applyEvent(stateInc, e2);
    stateInc.eventLogHead = e2.hash;

    // Replay
    async function* eventStream() {
      yield e1;
      yield e2;
    }
    const stateReplay = await Replayer.replay('proj1', eventStream());

    expect(stateReplay).toEqual(stateInc);
  });

  // Scenario 6: A gap in the hash chain is detected on replay
  test('Scenario 6: Hash Chain Gap Detection', async () => {
    const e1 = MutationEventBuilder.build('proj1', { type: 'project_create', name: 'Test', ownerId: 'u1' });
    const e2 = MutationEventBuilder.build('proj1', { type: 'tact_delta', path: 'a', delta: 'b' }, 'wrong-hash');
    
    async function* eventStream() {
      yield e1;
      yield e2;
    }

    await expect(Replayer.replay('proj1', eventStream())).rejects.toThrow('Hash chain divergence');
  });

  // Rule 3: No floating-point values
  test('Rule 3: Float Detection', () => {
    const payload = { type: 'tact_delta', value: 1.5 };
    expect(() => canonicalSerialize(payload)).toThrow('Non-integer value detected');
  });

  // Rule 2: Absent optional fields as null
  test('Rule 2: Optional fields as null', () => {
    const payload: any = { type: 'tact_delta', description: undefined, path: 'a', delta: 'b' };
    const serialized = canonicalSerialize(payload);
    const parsed = JSON.parse(serialized);
    expect(parsed.description).toBe(null);
  });
});
