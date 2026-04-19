/**
 * Canonical Serializer for MutationPayload
 * 
 * Rules:
 * 1. Keys sorted lexicographically.
 * 2. Optional fields that are absent are serialized as null, not omitted.
 * 3. No floating-point values anywhere.
 */

export function canonicalSerialize(payload: any): string {
  return JSON.stringify(sortKeys(payload));
}

function sortKeys(obj: any): any {
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (typeof obj !== 'object') {
    if (typeof obj === 'number' && !Number.isInteger(obj)) {
      throw new Error(`Non-integer value detected in payload: ${obj}`);
    }
    return obj;
  }

  // Object case
  const sortedObj: any = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    let value = obj[key];
    
    // Rule 2: absent optional fields as null
    if (value === undefined) {
      value = null;
    }
    
    sortedObj[key] = sortKeys(value);
  }

  return sortedObj;
}
