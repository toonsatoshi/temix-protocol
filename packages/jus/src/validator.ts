import { JUSEntry } from '@temix/types';

export class JUSValidator {
  /**
   * Performs structural validation of a JUSEntry.
   * This is a pre-check before semantic constraints.
   */
  static validate(entry: JUSEntry): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.ui?.label || entry.ui.label.trim() === '') {
      errors.push('UI label is required and cannot be empty.');
    }

    if (!entry.ui?.callback || entry.ui.callback.trim() === '') {
      errors.push('UI callback is required.');
    }

    if (!entry.opcode || !/^0x[0-9a-fA-F]{1,8}$/.test(entry.opcode)) {
      errors.push('Invalid opcode format. Must be a 32-bit hex string (e.g., 0x178d4519).');
    }

    if (!Array.isArray(entry.body)) {
      errors.push('Message body must be an array of fields.');
    }

    if (!Array.isArray(entry.constraints)) {
      errors.push('Constraints must be an array.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
