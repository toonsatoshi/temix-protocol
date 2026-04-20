# JULES.md
## Implementation Instructions for the Temix Protocol Monorepo
### Addressed directly to: Jules

---

Jules, this document is your operating manual for implementing the Temix Protocol. Everything in here is derived from `docs/Temix_White_Paper_v1_1.md` and `docs/TEMIX_ARCHITECTURE.md`. Read both of those documents before you read this one. This document tells you *how to build*. Those documents tell you *what you are building and why*. The why is load-bearing. If you don't understand the why, you will make wrong decisions when the architecture is ambiguous.

This document is structured as follows: Three Laws you never break. Build order you always follow. Affirmative implementation rules. Hard prohibitions. Package-by-package implementation notes. Failure modes you will encounter, catalogued with detection and recovery. Expected challenges with explicit guidance. Testing requirements. And a critical path test that tells you whether the system actually works.

---

## The Three Laws

These are not guidelines. They are structural invariants. Every other rule in this document is derived from one of these three. If you ever face a decision that isn't covered by a later rule, come back here and ask which law applies.

**Law 1: The event log is the only legitimate source of truth.**
No file, no in-memory state, no database row, no cached value is authoritative unless it was produced by replaying the event log. If you are ever tempted to write project state anywhere other than through `EventLog.append()`, you are violating Law 1. If you are ever tempted to read canonical state from anywhere other than the materializer's output (which is itself derived from the event log), you are violating Law 1.

**Law 2: Stage 2 is the only non-deterministic boundary. Everything else is deterministic and independently testable.**
DeepSeek is called in exactly one place: `packages/ai-engine/src/resolver.ts`. It is called from exactly one caller: `packages/pipeline/src/stages/Stage2Resolution.ts`. No other file in the entire codebase calls the DeepSeek API or makes any non-deterministic decision. If you find yourself putting AI logic anywhere else, stop. You are violating Law 2.

**Law 3: The Minimality Principle. The developer owns the output. The system facilitates, never imprisons.**
The Git exporter and Portal Manifest builder are first-class outputs, not afterthoughts. At any point in the lifecycle, a developer must be able to export a complete, self-contained, Temix-free project. Any architectural decision that makes this harder — that embeds Temix-specific runtime dependencies in the exported bot source, or that makes the event log non-exportable, or that stores state only in a Temix-proprietary format — violates Law 3.

---

## Build Order

Build strictly in this order. Do not build apps before their package dependencies are complete. Do not skip packages because you think you can stub them. The type system and Turborepo's task graph enforce this, but your decisions should enforce it first.

```
Phase 1 — Foundation
  1. packages/types          (zero deps — build this first, always)
  2. packages/db             (depends on types)
  3. packages/event-log      (depends on types, db)

Phase 2 — Schema and Validation
  4. packages/jus            (depends on types)
  5. packages/constraints-engine  (depends on jus, types)

Phase 3 — AI Boundary
  6. packages/ai-engine      (depends on types)

Phase 4 — Compilation and Execution
  7. packages/tact-compiler  (depends on types)
  8. packages/sandbox        (depends on types, tact-compiler)

Phase 5 — State
  9. packages/materializer   (depends on event-log, jus, types)

Phase 6 — Export
  10. packages/portal-generator  (depends on jus, types)

Phase 7 — Pipeline (assembles everything)
  11. packages/pipeline      (depends on ALL packages above)

Phase 8 — Applications (in any order, after pipeline is complete)
  12. apps/api
  13. apps/telegram-bot
  14. apps/mini-app
  15. apps/portal-runtime
```

The reason for this order is not aesthetic. `packages/pipeline` is the only package that depends on all other packages. It cannot compile until every upstream package compiles and exports its types correctly. If you try to build it early, you will spend time debugging import errors that don't exist in a correctly ordered build.

---

## What To Do

### Types First, Always

Every time you start implementing a new package, open `packages/types/src/` first. If the type you need doesn't exist, add it to the appropriate file in `packages/types` before writing any implementation code. The shape of the system lives in `packages/types`. Implementation packages fill that shape. Never define a core type inside an implementation package — move it to `packages/types` and import it.

The one exception: internal-only implementation types that are never shared across packages can be defined locally. The rule is: if two packages need the same type, it belongs in `packages/types`.

### The Canonical Serialization Contract

`packages/event-log/src/serializer.ts` produces the canonical serialization of any `MutationPayload`. You must implement this with three hard rules:
- Keys are sorted lexicographically. Always. No exceptions.
- Optional fields that are absent are serialized as `null`, not omitted.
- No floating-point values anywhere in any payload. All numeric fields use integer representations.

These three rules are what make the hash chain reproducible. Two identical payloads must produce bit-identical serializations regardless of the JavaScript runtime, the Node.js version, or the order in which the object's properties were assigned. If you violate any of these rules, the hash chain silently diverges. You will not catch this at compile time. You will catch it at the worst possible moment. Write the serializer first, write its tests second, and treat its test suite as sacred.

### The Hash Chain

Each `MutationEvent` has a `hash` field computed as:

```
SHA-256( canonical_serialize(payload) + prevEvent.hash )
```

For the genesis event (first event in a project), use the string `"genesis"` as the `prevHash`. This must be consistent across all implementations. Do not use `null`, `""`, or `undefined` for the genesis case — use the string `"genesis"`.

The hash is computed in `packages/event-log/src/MutationEvent.ts` and nowhere else. No other package recomputes event hashes. If you need to verify a hash, call the event log's verification method, not your own hash computation.

### Stage 2-B Suspension is a Database State, Not an In-Memory State

When the pipeline enters Stage 2-B, the `PipelineContext` is persisted to the database with `status: 'awaiting_audit'` and an `auditSessionId`. The pipeline then returns. It does not block. It does not hold a promise open. The Telegram bot handler receives the Stage 2-B result, formats the `ResolutionAuditCard`, sends it to the developer, and exits cleanly.

When the developer responds, a new Telegram message arrives. Stage 1 of the pipeline checks the developer's active session for a pending `auditSessionId`. If one exists, the pipeline skips Stage 2 entirely and resumes from Stage 3 with the developer's response as the explicit resolution. This is why the suspension must be in the database — the bot process may restart between the suspension and the resumption. Never rely on in-memory state for audit session tracking.

### Materializer Cache Discipline

The `Materializer` maintains an in-memory `CanonicalState` cache per project, keyed by `projectId`. This cache is an optimization. It is never the source of truth. The rules:

- On a new event, call `apply(event)` to update the cache incrementally.
- After a rollback, call `rebuild(projectId)` to replay from the event log. The cache for that project must be discarded entirely before rebuild begins.
- On a cold start (no cache entry for a projectId), call `rebuild(projectId)` to warm the cache from the event log before returning any state to the Mini App.
- Never serve a stale cache entry. If you are unsure whether the cache is current, rebuild. A rebuild is always correct. A stale cache is always wrong.

### WebSocket Broadcast Timing

The WebSocket broadcast to Mini App clients happens in Stage 5 (Materialization), after the event has been committed to the database in Stage 4. Never broadcast before Stage 4 completes. The broadcast should carry the updated `CanonicalState` — what is now true — not the pending state of what might become true. If Stage 5 or 6 fails after Stage 4, the event is committed and the state is canonical. The WebSocket broadcast is best-effort delivery of a notification. Clients that miss it will re-fetch on reconnect.

### The Constraints Engine is Stateless

`packages/constraints-engine` is a pure function package. Every function takes inputs and returns outputs. It does not query the database. It does not call the event log. It does not know about pipeline state. Any context it needs — the existing JUS entries, the current file tree — is passed into it as `ValidationContext`. The pipeline constructs `ValidationContext` from the project state before calling the constraints engine. If you find yourself adding a database import to the constraints engine, stop. You are violating its design contract.

### The `apps/` Directory is Thin

Apps wire packages together. They do not contain business logic. If you find yourself writing anything substantive — validation, transformation, state management, AI calls — inside an `apps/` directory, extract it to the appropriate `packages/` module. The apps are the surface. The packages are the system.

Specifically:
- `apps/api` orchestrates. It does not validate.
- `apps/telegram-bot` translates Telegram events to `PipelineInput` and `PipelineResult` to Telegram messages. It does not contain pipeline logic.
- `apps/mini-app` displays state and submits commands. It does not manage state.
- `apps/portal-runtime` manages bot instance lifecycle. It does not generate bot source.

### Export Must Be Self-Contained

The generated Portal Bot source (`packages/portal-generator/src/BotGenerator.ts`) must produce a Node.js/TypeScript project with zero Temix runtime dependencies. The generated bot imports `grammy` and `@ton/ton`. It imports nothing from `@temix/*`. Test this by attempting to build the generated bot output in a clean directory with no access to the Temix monorepo. If it fails, the export is broken.

---

## What Never To Do

**Never mutate canonical state directly.**
Never write to a `FileTree`, a `JUSSchema`, or a `CanonicalState` object without going through `EventLog.append()` first. The only legitimate path to state mutation is: pipeline → Stage 4 → EventLog.append() → Stage 5 → Materializer.apply(). Any shortcut through this path is a violation of Law 1. The ESLint rule banning direct mutation of objects named `state` or `log` catches the obvious cases. Do not assume it catches all cases.

**Never call DeepSeek outside of `packages/ai-engine`.**
There is no legitimate reason to call the DeepSeek API from any package other than `packages/ai-engine`. If you think you need to call it from elsewhere, you are wrong. Restructure your approach so that the AI-assisted behavior you need is expressed as a call to `packages/ai-engine`'s public API.

**Never let a `PartialResolution` proceed to Stage 3.**
If the AI Engine returns a `PartialResolution`, the pipeline branches to Stage 2-B. Full stop. A partial resolution that is forwarded to the constraints engine will either produce a misleading hard block (because the unresolved fields are malformed) or, worse, pass validation and produce a malformed event log entry. The Stage 2-B branch is not optional error handling. It is a required pipeline path.

**Never commit a rejected event as a committed event.**
The event log records both accepted and rejected events. `EventLog.reject()` exists for this purpose. A rejected event has `status: 'rejected'`. A committed event has `status: 'committed'`. These are different records with different consequences. A rejected event does not mutate the canonical state. Never call `EventLog.append()` for an event that failed Stage 3 validation. Never call `EventLog.reject()` for an event that passed.

**Never skip Stage 3.**
There is no fast path through the pipeline that bypasses validation. Even if you are certain the input is valid — because it came from a trusted internal source, because it is a rollback operation, because it is a conflict resolution — it goes through Stage 3. Rollback events and conflict resolution events have their own constraint checks. The constraints engine handles them. Do not hand-roll validation outside the constraints engine and then skip Stage 3.

**Never generate bot source with a Temix runtime dependency.**
See "Export Must Be Self-Contained" above. This deserves its own prohibition because it is the easiest mistake to make when implementing `BotGenerator.ts`. You will be tempted to import a utility from `@temix/jus` inside the generated bot code. Do not. Inline whatever you need or vendor it into the generated output. The generated bot is a customer deliverable. It must run without Temix.

**Never write mutable state into `packages/types`.**
`packages/types` is pure TypeScript type declarations. Zero runtime dependencies. Zero implementation code. If you find yourself adding a `class`, a `function`, or a `const` to `packages/types`, you are wrong. Move the implementation to the appropriate package.

**Never broadcast a WebSocket update before Stage 4 commits.**
See "WebSocket Broadcast Timing" above. The Mini App must only see state that is committed to the event log. A broadcast of pending state that subsequently fails to commit will produce a Mini App view that diverges from canonical state. This is a UI correctness bug that is very difficult to diagnose and very easy to create.

**Never use floating-point values in any event payload.**
TON's TVM uses integer arithmetic. All coin values, gas amounts, and timestamps are integers. If you find yourself storing a `number` that could be fractional in a `MutationPayload`, convert it to an integer representation before serialization. The canonical serializer does not protect against floats in the payload — it only enforces lexicographic key order and null substitution. Float detection is your responsibility before the payload reaches the serializer.

**Never clean up after a partial Stage 4 failure by attempting a compensating write.**
If `EventLog.append()` fails (database write error), the pipeline returns a rejection. That is the end. Do not attempt to undo anything, compensate for anything, or retry with a modified payload. The event log is append-only. Compensation writes produce a corrupted log. If Stage 4 fails, log the error, return a structured rejection to the caller, and let the developer resubmit. The pipeline is idempotent from the developer's perspective precisely because failures produce no committed state.

---

## Package-by-Package Implementation Notes

### `packages/types`

Start here. Before writing implementation code for any package, define or confirm the types it consumes and produces here. Pay particular attention to `MutationPayload` in `events.ts` — it is a discriminated union. Every new event type requires a new union member. The switch statement in the Materializer must be exhaustive. TypeScript will tell you when it is not, but only if you maintain the `never` guard in the default case. Put the `never` guard there on day one and never remove it.

### `packages/event-log`

This package requires 100% test coverage. No exceptions. Test the following scenarios explicitly:
- Genesis event creation (prevHash = "genesis")
- Subsequent event correctly references predecessor hash
- Two payloads that are structurally identical but property-insertion-ordered differently produce identical serializations
- A replay of N events produces the same CanonicalState as N incremental `apply()` calls
- `reject()` does not mutate canonical state
- A gap in the hash chain is detected on replay

Do not ship this package without all six tests passing.

### `packages/constraints-engine`

This package also requires 100% test coverage. The three deterministic checks (opcode uniqueness, serialization limit, type consistency) must have explicit test cases for:
- Pass case
- Hard block case
- Edge case at the exact boundary (1023 bits exactly is a pass; 1024 bits is a hard block)

The three heuristic checks (gas safety, bounce logic, reentrancy) must have:
- Warn case
- Pass case
- Safety Mode escalation (warn → hard block when `safetyModeEnabled: true`)

The constraints engine must never throw an unhandled exception. Any internal error in a constraint check must be caught and returned as a structured `IssueCard` with `violationType: 'internal_error'`. A crashed constraint layer is worse than a failed constraint check.

### `packages/ai-engine`

The DeepSeek client enforces `response_format: { type: 'json_object' }`. This does not guarantee that the response is a *valid* resolution output — only that it is valid JSON. The `parser.ts` must handle every possible malformed response and convert it into a `PartialResolution`, not a thrown exception. The pipeline treats a `ParserError` identically to a `PartialResolution`. Parser failures route to Stage 2-B. They never crash the pipeline.

Set the DeepSeek timeout to 15 seconds. Set the retry count to 3 with exponential backoff (1s, 2s, 4s). After 3 retries, return a `PartialResolution` with the timeout recorded in the audit card. The developer will see that the AI Engine timed out and can choose to provide the resolution manually or retry.

The prompts in `prompts/tactDelta.ts` and `prompts/jusMapping.ts` must inject the current project context at call time — the file tree, the existing JUS entries, and the last 5 committed event summaries. Context-free prompts produce hallucinated opcodes and duplicate handler names. The prompt is responsible for giving DeepSeek enough information to generate a non-colliding, project-aware resolution.

### `packages/jus`

`mapper.ts` is the most nuanced file in this package. The line between a full `JUSEntry` and a `PartialJUSEntry` must be precisely defined. Return a `PartialJUSEntry` when:
- A custom Tact message type is encountered whose serialization width cannot be computed from the type system alone
- The accumulated bit width of the message body fields exceeds 900 bits (warn margin — not the 1023-bit hard limit; leave headroom for the constraint layer)
- No available opcode can be assigned without colliding with an existing entry

Do not try to guess when you are in doubt. Return `PartialJUSEntry` and let Stage 2-B surface the gap to the developer. A wrong full `JUSEntry` that passes Stage 3 is a corrupted event log entry. A `PartialJUSEntry` that correctly routes to Stage 2-B is correct behavior.

### `packages/pipeline`

The `Pipeline.execute()` method is the most important method in the codebase. Its contract:
- It accepts a `PipelineInput`.
- It always returns a `PipelineResult`. It never throws.
- The `PipelineResult` is either `{ status: 'committed', event: MutationEvent }` or `{ status: 'rejected', issueCard: IssueCard }` or `{ status: 'awaiting_audit', auditSessionId: string }`.
- Every failure path returns a structured result. No unhandled exceptions escape this method.

The `PipelineContext` is threaded through each stage via parameter passing, not shared mutable state. Stages receive the context, read their designated upstream fields, write their designated output fields, and return a `StageResult`. The pipeline assembles the context incrementally. No stage should modify a field that a previous stage already wrote — enforce this with `Readonly<>` wrappers.

### `apps/api`

The Fastify server uses `@fastify/jwt` for authentication. The JWT is derived from Telegram's `initData` — the signed payload Telegram sends to Mini Apps on launch. Validate the `initData` signature against your `TELEGRAM_BOT_TOKEN` before issuing a JWT. Do not trust any JWT whose `initData` you did not validate. This is the authentication boundary for all Mini App requests.

The `POST /pipeline/submit` route must return immediately with a processing acknowledgment if the pipeline is going to take more than 2 seconds (i.e., if it involves a DeepSeek call). Use a job queue pattern: enqueue the pipeline execution, return a `jobId`, and let the Mini App poll or receive the result via WebSocket when complete. Do not hold the HTTP connection open for 8-15 seconds while DeepSeek thinks.

### `apps/telegram-bot`

The Telegram bot uses webhook mode in production and long-polling in development. Make this switchable via environment variable (`WEBHOOK_BASE_URL` presence = webhook mode, absence = long-polling). Long-polling is correct for local development. Never use long-polling in production — Telegram rate-limits it.

The `pipelineStatus.ts` view sends a "thinking" message immediately on pipeline submission, then edits that message in-place as stages complete. Use `ctx.reply()` to create the initial message and capture the `message_id`. Use `ctx.telegram.editMessageText()` with that `message_id` to update it. Do not send multiple messages per pipeline execution — it floods the developer's chat.

---

## Failure Modes

These are the specific failure modes you will encounter. They are listed because they are non-obvious, silent, or catastrophic if not handled correctly.

---

### FM-01: Hash Chain Divergence

**What it is:** Two events that should hash-chain to the same result produce different hashes because the serializer is not canonical. Common causes: JavaScript's non-deterministic object key ordering, optional field omission instead of null substitution, floating-point rounding in numeric fields.

**Detection:** Write a determinism test in `packages/event-log`: construct the same payload object twice via different property-insertion orders and assert that `serializer.serialize()` produces identical output. Run this test in CI. A failing determinism test is hash chain divergence waiting to happen.

**Recovery:** If discovered in production (a replay produces a different head hash than the stored head), the event log is corrupt for that project. This is catastrophic and unrecoverable without a rollback to the last known-good hash. Prevent it. Do not try to recover from it.

---

### FM-02: DeepSeek Returns Invalid JSON

**What it is:** Despite `response_format: { type: 'json_object' }`, DeepSeek occasionally returns malformed JSON, truncated responses, or valid JSON that does not match the expected schema. This is not a bug in your code. It is an inherent property of LLM APIs.

**Detection:** Every DeepSeek response passes through `packages/ai-engine/src/parser.ts` before the pipeline sees it. The parser wraps all parsing in try/catch and returns a `PartialResolution` on any failure.

**Recovery:** Route to Stage 2-B. The `ResolutionAuditCard` shown to the developer should indicate that the AI Engine returned an unparseable response, not that the developer's input was invalid. The developer can provide the resolution manually or retry. Log the raw DeepSeek response for debugging.

---

### FM-03: Orphaned Stage 2-B Audit Session

**What it is:** The pipeline suspends in Stage 2-B and persists an `awaiting_audit` context to the database. The developer then abandons the project, starts a new command, or the bot process restarts. The audit session sits in the database forever, blocking that project from processing new commands while in the suspended state.

**Detection:** Query for `PipelineContext` rows with `status: 'awaiting_audit'` older than a configurable TTL (recommend 24 hours). These are orphaned sessions.

**Recovery:** A background job running every hour marks sessions older than 24 hours as `expired`. An expired session is removed from the blocking queue. The developer's next command starts a fresh pipeline execution. When the developer eventually responds to the expired audit card, the response is tagged with an `auditSessionId` that no longer exists — the pipeline returns a structured error explaining that the audit session expired and asks the developer to resubmit their original command.

---

### FM-04: Materializer Cache / Event Log Divergence

**What it is:** The materializer's in-memory cache for a project has diverged from what the event log would produce on a fresh replay. Causes: the process restarted after a Stage 4 commit but before Stage 5 materialization; an incremental `apply()` had a bug that was subsequently fixed but the cache was not invalidated; the materializer received events out of order.

**Detection:** On every cache read, compare the cached state's `eventLogHead` hash with the actual head hash from `EventLog.getHead()`. If they differ, the cache is stale.

**Recovery:** Call `Materializer.rebuild(projectId)`. This replays the full event log and replaces the cache. It is slower than an incremental apply but always produces correct state. Treat cache miss as a rebuild trigger, not an error.

---

### FM-05: Tact Compiler Temp Directory Leak

**What it is:** `packages/tact-compiler/src/compiler.ts` writes the materialized file tree to a temporary directory before invoking the Tact compiler. If the compiler process crashes (not returns an error — crashes), the cleanup code in the `finally` block may not execute, leaving temp directories accumulating on disk.

**Detection:** Monitor disk usage on the compile service. Temp directories accumulate at `/tmp/temix-compile-*`.

**Recovery:** Add a startup cleanup pass in `compiler.ts` that removes any `/tmp/temix-compile-*` directories older than 1 hour before accepting compile requests. This handles crash-recovery scenarios without requiring manual intervention.

---

### FM-06: Stars Credit Race Condition

**What it is:** Two concurrent deployment requests for the same project check the Stars credit balance simultaneously. Both see sufficient balance. Both decrement. The balance goes negative.

**Detection:** This is a classic TOCTOU (time-of-check/time-of-use) race. It is only possible if your deployment route is not serialized per-user.

**Recovery:** Implement an optimistic lock on the `User.starsBalance` field. The deployment transaction uses a `WHERE stars_balance >= cost` condition on the update. If the update affects 0 rows, the balance was insufficient after the concurrent decrement — return an insufficient balance error. Do not rely on the pre-check read to guarantee the balance. Only the atomic update is authoritative.

---

### FM-07: WebSocket Client Receiving State for Wrong Project

**What it is:** A Mini App client subscribes to WebSocket updates for `projectId: "A"`. A bug in the subscription handler sends that client updates for `projectId: "B"`. The developer sees another project's state updates in their dashboard.

**Detection:** The WebSocket handler must validate the `projectId` subscription against the authenticated user's project ownership before delivering any update. If `userId` does not own `projectId`, the subscription is rejected.

**Recovery:** This is a data isolation bug with privacy implications. Prevent it with server-side subscription validation. Never rely on the client to filter its own update stream.

---

### FM-08: Portal Runtime Worker Thread Crash Propagating

**What it is:** `apps/portal-runtime/src/runtime.ts` runs each bot instance in an isolated worker thread. If the worker thread crashes in a way that propagates to the parent process (uncaught `Error` in the worker that isn't caught by the worker error handler), it can take down the runtime process and all other bot instances with it.

**Detection:** Attach an `error` event listener to every worker thread at instantiation time. Log and handle all worker errors at the parent level.

**Recovery:** On worker error: mark the bot as `degraded`, attempt restart (up to 3 times), notify the project owner. The parent process must not crash when a worker crashes. This is enforced by the `error` listener — an unlistened-to `error` event on a worker thread is an unhandled exception in Node.js.

---

### FM-09: Git Export Producing Non-Reproducible Commit History

**What it is:** `packages/portal-generator/src/GitExporter.ts` reconstructs the project's development history as a standard Git repository. If the Git commit timestamps are derived from `Date.now()` at export time rather than from the `MutationEvent.timestamp` field, each export of the same project produces a different Git history (different commit SHAs). This breaks reproducibility.

**Detection:** Export the same project twice. The resulting Git bundles should be identical. If they differ, the export is not reproducible.

**Recovery:** Use `MutationEvent.timestamp` as the Git commit author date and committer date. Use the event's `hash` as the commit message suffix. Do not use wall clock time anywhere in the Git export. The Git history is a deterministic artifact of the event log. It must always be the same.

---

## Expected Challenges

### Challenge 1: Turborepo Cache Invalidation

Turborepo caches build outputs based on input file hashes. This is fast and usually correct. The exception: when you change a type in `packages/types`, Turborepo may not correctly detect that downstream packages need to rebuild if their source files didn't change — only their type inputs changed. If you are seeing type errors in a package that you haven't touched, run `turbo build --force` to bypass the cache. Do not waste time debugging stale cache artifacts. Force-rebuild when type errors appear in packages you haven't modified.

### Challenge 2: Base44 SDK Integration
The system uses the Base44 SDK for its persistence layer. Each entity (MutationEvent, Project, User) is accessed through typed wrappers exported from `@temix/db`. This ensures type safety across the monorepo without the need for a complex local generation step.


### Challenge 3: DeepSeek JSON Mode Reliability

DeepSeek's `response_format: { type: 'json_object' }` is reliable for simple schemas. It degrades for complex, deeply nested schemas. The Tact delta + JUS entry response is a moderately complex nested object. To maximize reliability: (1) keep the output schema as flat as possible in the prompt definition; (2) provide 3-5 few-shot examples of correct responses in the prompt; (3) explicitly tell DeepSeek the exact field names and types expected; (4) treat any response that requires more than one level of `.content[0]?.tactDelta` navigation as a sign your schema is too deep.

If you find DeepSeek returning valid JSON that doesn't match your schema more than ~5% of the time, simplify the schema. The parser's job is to handle failures, not to normalize complex responses.

### Challenge 4: TVM Bit-Width Calculation for Exotic Tact Types

`packages/constraints-engine/src/deterministic/serializationLimit.ts` must calculate the bit width of every field in a JUS message body. The bit widths of standard Tact types are documented and stable:
- `Int as coins` = 124 bits (varuint16)
- `Int as uint64` = 64 bits
- `Address` = 267 bits (2-bit flag + 8-bit workchain + 256-bit hash)
- `Bool` = 1 bit
- `Cell` = reference (does not consume the 1023-bit cell budget — it is a reference to a new cell)

The challenge is custom Tact message types. When a JUS body field references a custom type, you cannot compute its bit width without inspecting the type definition in the Tact source. `serializationLimit.ts` receives the `ResolutionOutput` which includes the Tact delta. Parse the delta for the custom type definition before computing the width. If the custom type cannot be found in the delta or the current file tree, return a `PartialJUSEntry` from the mapper — do not guess the width.

### Challenge 5: Telegram `initData` Validation

The Mini App authenticates by sending Telegram's `initData` string to `apps/api`. You must validate this signature using the HMAC-SHA256 method described in Telegram's Mini App documentation. The algorithm:
1. Parse the `initData` string into key-value pairs.
2. Remove the `hash` field and sort the remaining pairs alphabetically.
3. Join them as `key=value\n` (newline-separated).
4. Compute `HMAC-SHA256` of the joined string using `HMAC-SHA256("WebAppData", BOT_TOKEN)` as the key.
5. Compare with the `hash` field.

Get this wrong and your authentication layer is broken. Do not implement a simplified version. Do not skip signature validation in production. Test it against real `initData` from a deployed test bot before shipping.

### Challenge 6: `@ton/sandbox` Transaction Trace Format

`packages/sandbox/src/TemporalTimeline.ts` parses the raw `@ton/sandbox` transaction trace into `TimelineStep` entries. The `@ton/sandbox` transaction trace format is not formally documented and changes between minor versions. Pin the `@ton/sandbox` version in `packages/sandbox/package.json` and do not upgrade it without testing that the trace format is still correctly parsed. The `GasTracer` and `TemporalTimeline` are the two components most likely to break silently on a sandbox version upgrade.

### Challenge 7: `grammy` Webhook Mode vs. Long-Polling Switching

The `apps/telegram-bot` bot must work in both webhook mode (production) and long-polling mode (development). `grammy` supports both, but the initialization path differs: webhook mode requires a registered webhook URL and a secret token; long-polling mode starts immediately. The bot's `index.ts` must detect the mode from the environment at startup and configure accordingly. Do not start the bot in long-polling mode in production — Telegram will serve updates to the long-polling connection rather than the webhook, causing missed updates and confusing behavior.

---

## Testing Requirements

### Coverage Floors

These are minimums. Treat them as floors, not targets.

| Package | Required Coverage |
|---|---|
| `packages/event-log` | 100% |
| `packages/constraints-engine` | 100% |
| `packages/pipeline/stages/Stage2BResolutionAudit.ts` | 100% |
| All other `packages/` | 80% |
| All `apps/` | 60% |

### The Determinism Test Suite

Every deterministic component must have a determinism test: given the same input, multiple invocations produce identical output. This applies to: the serializer, the hash chain, the constraints engine, the JUS mapper (for full JUSEntry cases), the portal generator, and the Git exporter. Non-determinism in any of these components is a correctness bug, not a performance bug.

### Integration Test: The Critical Path

Before any release, run the following manual integration test end to end:

1. Send the message "Add a Transfer button that sends 1 TON to a recipient address" to the Temix bot.
2. Confirm that a "thinking" message appears immediately.
3. Confirm that the pipeline completes with a success status and an event number.
4. Open the Mini App. Confirm the file tree shows the updated Tact file with the transfer handler.
5. Confirm the Portal Preview shows a "Transfer" button.
6. Navigate to the Temporal Timeline. Run a sandbox simulation. Confirm the message cascade is visible.
7. Send a manual edit via the Mini App that changes the gas limit in the transfer handler.
8. Confirm a conflict is detected and the three-way diff is surfaced in the Telegram bot.
9. Resolve the conflict by choosing the manual edit.
10. Export the project as a Git bundle.
11. Clone the exported Git bundle in a clean directory with no Temix monorepo access.
12. Run `npm install && npm run build` in the exported bot directory.
13. Confirm it builds successfully with no Temix imports.

If any step fails, the system is not shippable.

---

## Final Note to Jules

The system you are building has a specific philosophical commitment: that a developer should be able to build a production TON contract and deploy it from a Telegram chat on a phone, and then walk away with every artifact they produced — code, history, bot — in a form that never needs Temix again. Every line of code you write is either serving that commitment or violating it.

When you are uncertain about a decision, ask: does this make the developer more sovereign over their output, or less? The answer is the architecture.

The event log is the system. Everything else is the surface.

---

*JULES.md — Temix Protocol Implementation Bible — v1.0*
*Derived from: Temix White Paper v1.1, TEMIX_ARCHITECTURE v1.1, patent v1.1*
*All implementation decisions that conflict with this document should be escalated, not silently resolved.*
