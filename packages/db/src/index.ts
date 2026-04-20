import { db } from './client';
export * from './client';

export const entities = {
  MutationEvent: db.entities.MutationEvent,
  Project: db.entities.Project,
  User: db.entities.User,
  CanonicalState: db.entities.CanonicalState,
  DeploymentRecord: db.entities.DeploymentRecord,
  PipelineContext: db.entities.PipelineContext,
};
