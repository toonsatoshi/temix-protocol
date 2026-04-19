import { JUSEntry, IssueCard } from '@temix/types';
import { IssueCardBuilder } from '../IssueCard';

const TACT_TYPE_WIDTHS: Record<string, number> = {
  'coins': 124,
  'uint64': 64,
  'uint32': 32,
  'Address': 267,
  'Bool': 1,
};

export function checkSerializationLimit(entry: JUSEntry): IssueCard | null {
  let totalBits = 32; // Opcode itself is 32 bits

  for (const field of entry.body) {
    const width = TACT_TYPE_WIDTHS[field.type] || field.bits || 0;
    if (width === 0) {
      return IssueCardBuilder.build(
        'internal_error',
        'serialization_limit',
        `Unknown bit width for type "${field.type}".`,
        field.name
      );
    }
    totalBits += width;
  }

  if (totalBits > 1023) {
    return IssueCardBuilder.build(
      'deterministic',
      'serialization_limit',
      `Message body size (${totalBits} bits) exceeds the TVM 1023-bit cell limit.`,
      'body',
      `Reduce field count or use Cell references for large data. Overage: ${totalBits - 1023} bits.`
    );
  }

  return null;
}
