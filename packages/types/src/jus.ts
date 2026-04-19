/**
 * JUS (JSON UI Schema) type system
 * Formal specification of the Tact-to-Telegram mapping model.
 */

export type JUSConstraint =
  | 'serialization_limit'
  | 'bounce_coverage'
  | 'opcode_uniqueness'
  | 'type_consistency';

export interface JUSUIComponent {
  label: string;
  callback: string;
  keyboardLayout?: {
    row: number;
    col: number;
  };
}

export interface JUSField {
  name: string;
  type: string; // e.g., 'coins', 'uint64', 'Address', 'Bool', 'Cell'
  bits?: number;
}

export interface JUSOpcodeBinding {
  opcodeHex: string; // 32-bit hex string, e.g., "0x178d4519"
  messageBodySchema: JUSField[];
}

export interface JUSEntry {
  ui: JUSUIComponent;
  opcode: string; // hex string
  body: JUSField[];
  constraints: JUSConstraint[];
}

/**
 * PartialJUSEntry is used during Stage 2-B Resolution Audit
 * when the AI cannot deterministically resolve all fields.
 */
export interface PartialJUSEntry {
  ui?: Partial<JUSUIComponent>;
  opcode?: string;
  body?: Partial<JUSField>[];
  constraints?: JUSConstraint[];
  unresolvedFields: string[];
  reason: string;
}

export interface JUSSchema {
  entries: Record<string, JUSEntry>; // Keyed by opcodeHex
}
