export interface JUSField {
  name: string;
  type: string;
  bits?: number;
}

export interface JUSEntry {
  opcode: number;
  name: string;
  fields: JUSField[];
}

export interface JUSSchema {
  version: string;
  entries: JUSEntry[];
}

export interface PartialJUSEntry {
  name?: string;
  opcode?: number;
  fields?: Partial<JUSField>[];
  reason: string;
}
