import { JUSEntry, PartialJUSEntry } from '@temix/types';

/**
 * Mapper between Tact receive handlers and JUS entries.
 */
export class JUSMapper {
  /**
   * Maps a (pseudo) parsed Tact handler to a JUS entry candidate.
   * In a real implementation, 'handler' would be an AST node from the Tact compiler.
   */
  static mapHandlerToJUS(
    handlerName: string,
    messageType: any, // Placeholder for Tact message type definition
    existingOpcodes: string[]
  ): JUSEntry | PartialJUSEntry {
    // This is the core logic for Stage 2-B triggers.
    
    const unresolvedFields: string[] = [];
    
    // Condition 1: Type ambiguity or unknown custom types
    if (!messageType || messageType.isExotic) {
      unresolvedFields.push('body');
    }

    // Condition 2: Opcode unavailability or collision
    let opcode = messageType?.opcode;
    if (!opcode || existingOpcodes.includes(opcode)) {
      unresolvedFields.push('opcode');
    }

    if (unresolvedFields.length > 0) {
      return {
        unresolvedFields,
        reason: `AI could not deterministically resolve: ${unresolvedFields.join(', ')}`,
        ui: { label: handlerName, callback: `call_${handlerName.toLowerCase()}` },
        opcode: opcode,
      } as PartialJUSEntry;
    }

    // Success Case
    return {
      ui: { label: handlerName, callback: `call_${handlerName.toLowerCase()}` },
      opcode: opcode!,
      body: messageType.fields, // Assuming fields are already mapped to JUSField[]
      constraints: ['serialization_limit', 'opcode_uniqueness', 'type_consistency'],
    } as JUSEntry;
  }
}
