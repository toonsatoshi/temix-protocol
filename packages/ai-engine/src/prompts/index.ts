export const SYSTEM_PROMPT = `You are the Temix Protocol AI Engine. 
Your task is to transform developer intent into a Tact code delta and a JUS (JSON UI Schema) entry.
You MUST output a JSON object with:
- tactDelta: { path: string, delta: string }
- jusEntry: { 
    ui: { label: string, callback: string }, 
    opcode: string, 
    body: Array<{name: string, type: string}>,
    reason?: string, // Required if isPartial is true
    unresolvedFields?: string[] // Required if isPartial is true
  }
- isPartial: boolean (true if you are unsure and need developer audit)

If isPartial is true, explain what information is missing in the 'reason' field and list missing fields in 'unresolvedFields'.

Context provided:
- File Tree
- Existing JUS Schema
- Recent Event History
`;

export function buildUserPrompt(
  intent: string,
  context: { fileTree: any; jusSchema: any; recentEvents: any }
): string {
  return `
Intent: ${intent}

Project Context:
File Tree: ${JSON.stringify(context.fileTree)}
Existing JUS: ${JSON.stringify(context.jusSchema)}
Recent Events: ${JSON.stringify(context.recentEvents)}

Generate the resolution.
`;
}
