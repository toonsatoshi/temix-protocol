import { Pipeline } from './packages/pipeline/src/Pipeline';
import { CanonicalState } from './packages/types/src/index';
import * as dotenv from 'dotenv';

dotenv.config();

async function simulateTipCommand() {
  const pipeline = new Pipeline(process.env.DEEPSEEK_API_KEY!);
  
  const mockState: CanonicalState = {
    projectId: 'mock-project-id',
    eventLogHead: 'genesis',
    fileTree: [],
    artifacts: null,
    jus: { entries: {} },
    deploymentRecords: [],
  };

  console.log('--- STARTING SIMULATION ---');
  console.log('Intent: "Create a Tip Me button that sends 1 TON to the contract owner."');

  const result = await pipeline.execute(
    {
      projectId: 'mock-project-id',
      userId: 'mock-user-id',
      type: 'declarative',
      content: 'Create a Tip Me button that sends 1 TON to the contract owner.',
    },
    mockState,
    (stage) => console.log(`[PIPELINE PROGRESS] ${stage} complete.`)
  );

  console.log('--- FINAL RESULT ---');
  console.log(JSON.stringify(result, null, 2));
}

simulateTipCommand().catch(console.error);
