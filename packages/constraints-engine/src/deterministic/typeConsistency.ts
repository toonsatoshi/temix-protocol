import { JUSEntry, IssueCard } from '@temix/types';
import { IssueCardBuilder } from '../IssueCard';

export function checkTypeConsistency(
  entry: JUSEntry,
  tactHandler: any // Mock of parsed Tact handler
): IssueCard | null {
  // In a real implementation, this would compare entry.body types
  // with the types in the Tact source code.
  if (!tactHandler) return null;

  for (const field of entry.body) {
    const tactField = tactHandler.params.find((p: any) => p.name === field.name);
    if (!tactField) {
      return IssueCardBuilder.build(
        'deterministic',
        'type_consistency',
        `Field "${field.name}" defined in JUS but missing in Tact handler.`,
        field.name
      );
    }
    // Type checking logic...
  }

  return null;
}
