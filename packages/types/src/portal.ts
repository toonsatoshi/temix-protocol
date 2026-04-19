export interface BotConfiguration {
  botTokenEnvVar: string;
  tonEndpoint: string;
  network: 'mainnet' | 'testnet';
}

export interface PortalManifest {
  projectId: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  entryPoint: string;
  config: BotConfiguration;
  createdAt: number;
}
