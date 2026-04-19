import { JUSEntry, JUSSchema as IJUSSchema, MutationEvent } from '@temix/types';

export class JUSSchemaManager implements IJUSSchema {
  entries: Record<string, JUSEntry> = {};

  add(entry: JUSEntry): void {
    this.entries[entry.opcode] = entry;
  }

  get(opcode: string): JUSEntry | undefined {
    return this.entries[opcode];
  }

  has(opcode: string): boolean {
    return !!this.entries[opcode];
  }

  toArray(): JUSEntry[] {
    return Object.values(this.entries);
  }

  /**
   * Reconstructs the JUS Schema from a stream of mutation events.
   */
  static async fromEvents(events: AsyncIterable<MutationEvent>): Promise<JUSSchemaManager> {
    const schema = new JUSSchemaManager();
    for await (const event of events) {
      if (event.payload.type === 'jus_entry') {
        schema.add(event.payload.entry);
      } else if (event.payload.type === 'rollback') {
        // Simple MVP rollback: clear and caller should replay up to target
        return schema; 
      }
    }
    return schema;
  }
}
