import { JUSEntry, JUSSchema, IssueCard } from '@temix/types';
import { IssueCardBuilder } from '../IssueCard';

export function checkOpcodeUniqueness(
  entry: JUSEntry,
  schema: JUSSchema
): IssueCard | null {
  const collision = schema.entries[entry.opcode];
  if (collision) {
    return IssueCardBuilder.build(
      'deterministic',
      'opcode_uniqueness',
      `Opcode ${entry.opcode} is already bound to handler "${collision.ui.label}".`,
      'opcode',
      'Use a different opcode or rename the existing handler.'
    );
  }
  return null;
}
