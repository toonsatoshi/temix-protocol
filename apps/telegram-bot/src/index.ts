import { launchBot } from './bot';

launchBot().catch((err) => {
  console.error('Failed to launch bot:', err);
  process.exit(1);
});
