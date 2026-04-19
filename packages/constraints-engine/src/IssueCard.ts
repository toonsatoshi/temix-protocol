import { IssueCard } from '@temix/types';

export class IssueCardBuilder {
  static build(
    violationType: 'deterministic' | 'heuristic' | 'internal_error',
    constraintId: string,
    message: string,
    affectedField?: string,
    suggestedCorrection?: string
  ): IssueCard {
    return {
      violationType,
      constraintId,
      humanReadableMessage: message,
      affectedField,
      suggestedCorrection,
    };
  }
}
