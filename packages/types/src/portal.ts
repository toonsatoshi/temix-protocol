import { JUSSchema } from './jus';

/**
 * Portal Bot and Deployment related types
 */

export interface DeploymentRecord {
  id: string;
  projectId: string;
  contractAddress: string;
  txHash: string;
  network: 'mainnet' | 'testnet';
  timestamp: number;
  starsSpent: number;
}

export interface PortalBotConfig {
  webhookUrl: string;
  token: string;
  isManaged: boolean;
}

export interface PortalManifest {
  compiledContract: {
    boc: string;
    abi: string;
  };
  jusSchema: JUSSchema;
  portalBotSource: string; // generated source code
  readme: string;
}
