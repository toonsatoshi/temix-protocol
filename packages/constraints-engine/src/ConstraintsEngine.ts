import { JUSEntry, JUSSchema, IssueCard, ResolutionOutput } from '@temix/types';
import { checkOpcodeUniqueness } from './deterministic/opcodeUniqueness';
import { checkSerializationLimit } from './deterministic/serializationLimit';
import { checkTypeConsistency } from './deterministic/typeConsistency';
import { checkGasSafety } from './heuristic/gasSafety';

export interface ValidationResult {
  status: 'pass' | 'hard_block' | 'warn';
  issues: IssueCard[];
}

export class ConstraintsEngine {
  /**
   * Validates a resolution against the project context.
   */
  static validate(
    resolution: ResolutionOutput,
    existingSchema: JUSSchema,
    safetyMode: boolean = false
  ): ValidationResult {
    const issues: IssueCard[] = [];
    const entry = resolution.jusEntry;

    // 1. Deterministic Checks (Always Hard Block)
    const deterministicChecks = [
      () => checkOpcodeUniqueness(entry, existingSchema),
      () => checkSerializationLimit(entry),
      () => checkTypeConsistency(entry, null), // tactHandler mock
    ];

    for (const check of deterministicChecks) {
      const issue = check();
      if (issue) {
        return { status: 'hard_block', issues: [issue] };
      }
    }

    // 2. Heuristic Checks (Warn or Hard Block in Safety Mode)
    const heuristicChecks = [
      () => checkGasSafety(entry),
    ];

    for (const check of heuristicChecks) {
      const issue = check();
      if (issue) {
        issues.push(issue);
      }
    }

    if (issues.length > 0) {
      return {
        status: safetyMode ? 'hard_block' : 'warn',
        issues,
      };
    }

    return { status: 'pass', issues: [] };
  }
}
