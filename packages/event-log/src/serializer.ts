/**
 * Canonical Serializer for MutationPayload
 * 
 * Rules:
 * 1. Keys sorted lexicographically.
 * 2. Optional fields that are absent/undefined are serialized as null.
 * 3. No floating-point values anywhere.
 * 4. Manual string construction to ensure engine-independent determinism.
 */

export function canonicalSerialize(payload: any): string {
  if (payload === null || payload === undefined) {
    return 'null';
  }

  if (Array.isArray(payload)) {
    return '[' + payload.map(item => canonicalSerialize(item)).join(',') + ']';
  }

  if (typeof payload !== 'object') {
    if (typeof payload === 'number' && !Number.isInteger(payload)) {
      throw new Error(`Non-integer value detected in payload: ${payload}`);
    }
    return JSON.stringify(payload);
  }

  // Object case
  const keys = Object.keys(payload).sort();
  const parts: string[] = [];

  for (const key of keys) {
    const value = payload[key];
    
    const normalizedValue = value === undefined ? null : value;
    parts.push(`${JSON.stringify(key)}:${canonicalSerialize(normalizedValue)}`);
  }

  return '{' + parts.join(',') + '}';
}
