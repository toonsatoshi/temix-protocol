# Temix Protocol — Monorepo Architecture
### TypeScript / Node.js · Monorepo · MVP Scale
### AI Engine: DeepSeek API

---

## Governing Principles

Every architectural decision in this document is derived directly from the Temix white paper. Three rules were applied without exception:

1. **The Event Log is the only source of truth.** No file, state, or artifact is mutated directly. Everything is materialized by replaying the log.
2. **Stage 2 is the only non-deterministic boundary.** DeepSeek lives exclusively in the AI Engine package. All other stages are fully deterministic and independently testable.
3. **The Minimality Principle is structural, not aspirational.** The Git exporter and Portal Manifest builder are first-class packages, not afterthoughts.

**Scope Declaration — MVP:** This architecture is scoped to single-developer, single-project sessions. Each project has one owner. There is no concurrent pipeline submission, collaborator role system, or shared event log in v1.0. The hash-linked event log and CQRS separation are structurally compatible with multi-user extension, but that extension is explicitly deferred to Phase 3. Any implementation that assumes single-writer semantics is correct for this version and does not need to be refactored to accommodate future collaboration — the event log is the right primitive for that future, and it is already in place.

---

## Workspace Overview

```
temix-protocol/
├── apps/
│   ├── api/                    ← Backend API server (CQRS orchestrator)
│   ├── telegram-bot/           ← Command Interface (write side)
│   ├── mini-app/               ← Mini App dashboard (read side)
│   └── portal-runtime/         ← Managed Portal Bot hosting runtime
├── packages/
│   ├── types/                  ← Canonical shared TypeScript types
│   ├── db/                     # Base44 SDK database layer
│   ├── event-log/              # Hash-linked append-only event log

│   ├── pipeline/               ← Six-Stage Deterministic Pipeline
│   ├── ai-engine/              ← Hybrid AI Engine (DeepSeek)
│   ├── constraints-engine/     ← Semantic Constraints Engine
│   ├── jus/                    ← JSON UI Schema system
│   ├── materializer/           ← State Materialization Engine
│   ├── tact-compiler/          ← Tact compilation wrapper
│   ├── sandbox/                ← TON Sandbox + Temporal Timeline Layer
│   └── portal-generator/       ← Portal Bot + Manifest + Git export
├── docs/
│   ├── Temix_White_Paper_v1_1.md   ← Protocol specification and rationale
│   ├── TEMIX_ARCHITECTURE.md       ← This document — monorepo file tree
│   └── patent.md                   ← Patent application draft
├── config/
│   ├── tsconfig.base.json
│   ├── eslint.config.js
│   └── jest.config.base.js
├── package.json                ← Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                  ← Turborepo task graph
└── .env.example
```

---

## Full File Tree with Descriptions

---

### `/` — Workspace Root

```
temix-protocol/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

**`package.json`**
The workspace root manifest. Declares the pnpm workspace, global devDependencies (TypeScript, ESLint, Prettier, Turborepo), and root-level scripts (`dev`, `build`, `test`, `lint`). Does not contain application logic. All workspace packages are referenced via the `workspaces` field.

**`pnpm-workspace.yaml`**
Declares `apps/*` and `packages/*` as workspace members. This is what enables cross-package imports like `@temix/types` and `@temix/event-log` without publishing to npm. pnpm is chosen over npm/yarn for its symlink-based node_modules structure, which is faster and more reliable in a monorepo of this depth.

**`turbo.json`**
Turborepo pipeline configuration. Defines the task dependency graph: `build` depends on upstream `build`, `test` depends on `build`, `dev` runs in parallel. This ensures that when you run `turbo dev`, packages compile in topological order before apps start. Critical for a monorepo where `apps/api` depends on `packages/pipeline` which depends on `packages/event-log`.

**`.env.example`**
Template for all required environment variables across the workspace. Includes: `DEEPSEEK_API_KEY`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TON_ENDPOINT`, `TON_API_KEY`, `REDIS_URL`, `WEBHOOK_BASE_URL`, `STARS_WEBHOOK_SECRET`, `JWT_SECRET`. Every secret used anywhere in the system is documented here. No defaults are provided for secrets.

---

### `/docs/` — Protocol Documentation

```
docs/
├── Temix_White_Paper_v1_1.md
├── TEMIX_ARCHITECTURE.md
└── patent.md
```

This directory is not a build artifact, a generated output, or a secondary reference. It is a first-class member of the repository. The three documents it contains are the specification layer of the protocol — the source of truth from which the architecture is derived, and the record against which every implementation decision can be audited.

**`docs/Temix_White_Paper_v1_1.md`**
The Temix Protocol white paper. The governing document for all architectural decisions in this repository. Defines the protocol's thesis (the Headless IDE paradigm), its system architecture (CQRS applied to the development lifecycle), the six-stage deterministic pipeline, the JUS synchronization standard, the Temporal Timeline Layer, the conflict resolution model, the monetization model (Thinking Phase / Sprint Phase), the Minimality Principle and Git exit, the competitive positioning (including AI-native threat analysis), the four-phase roadmap, and the team section. Every governing principle stated at the top of this architecture document traces back to a section of the white paper. When an implementation decision conflicts with the white paper, the white paper wins. When the white paper needs revision, the revision is made there first and propagated to the architecture.

**`docs/TEMIX_ARCHITECTURE.md`**
This document. The monorepo file tree specification. Documents every file in the repository with its declared responsibility, its package dependencies, and its role in the pipeline. Self-referential by design: the architecture document lives in the repository it describes, making it versionable, diffable, and reviewable alongside the code it specifies. When a new file is added to the monorepo, a corresponding entry in this document is required as part of the same commit. A file without a named role in this document does not belong in the repository.

**`docs/patent.md`**
The patent application draft for the Temix Protocol's core inventions. Covers two independent claim sets: (1) the deterministic chat-to-code transformation pipeline — the method, system, and computer-readable medium claims for transforming natural language input into validated, immutable, replayable codebase state transitions; and (2) the JUS schema system — the method and system claims for generating a deterministic user interface specification from a software contract interface definition, with atomic co-commitment enforcing the synchronization invariant between implementation and interface. This document is a working draft and is not filed. It is versioned in the repository to maintain a prior art record and to track the evolution of the claims as the protocol is implemented. Legal review is required before filing.

---

### `/config/` — Shared Configuration

```
config/
├── tsconfig.base.json
├── eslint.config.js
└── jest.config.base.js
```

**`tsconfig.base.json`**
The base TypeScript configuration extended by every package and app. Sets `strict: true`, `target: ES2022`, `moduleResolution: bundler`, `declaration: true`, `declarationMap: true`. Path aliases are not defined here — they are defined per-package. Enabling `strict` at the root enforces null-safety and type coverage across the entire codebase, which is non-negotiable for a system where type mismatches are a hard block at Stage 3.

**`eslint.config.js`**
Flat ESLint configuration (ESLint v9+). Applies `@typescript-eslint/recommended`, enforces `no-explicit-any`, requires explicit return types on exported functions, and bans direct mutation of objects named `state` or `log` (enforced via custom rules). This last rule is a lint-level guard against accidentally bypassing the event log.

**`jest.config.base.js`**
Base Jest configuration for unit tests. Sets `preset: ts-jest`, `testEnvironment: node`, coverage thresholds (80% minimum for `packages/`, 60% for `apps/`). The constraints-engine and event-log packages require 100% coverage by convention — this is enforced here via per-directory overrides.

---

### `/packages/types/` — Canonical Shared Types

```
packages/types/
├── src/
│   ├── index.ts
│   ├── events.ts
│   ├── pipeline.ts
│   ├── jus.ts
│   ├── project.ts
│   └── portal.ts
├── package.json
└── tsconfig.json
```

This package has zero runtime dependencies. It is pure TypeScript type declarations. Every other package in the monorepo imports from `@temix/types`. It is the single place where the shape of the system is formally defined.

**`src/events.ts`**
Defines `MutationEvent` — the core unit of the system. Shape: `{ id: string, hash: string, prevHash: string | null, timestamp: number, projectId: string, payload: MutationPayload, status: 'committed' | 'rejected' }`. Also defines `MutationPayload` as a discriminated union of all possible event types: `TactDeltaEvent`, `JUSEntryEvent`, `ConflictResolutionEvent`, `DeploymentEvent`, `RollbackEvent`. The discriminated union is what makes the materializer's switch statement exhaustive and type-safe.

**`src/pipeline.ts`**
Defines the types that flow through the Six-Stage Pipeline: `PipelineInput` (raw developer intent from either chat or Mini App), `PipelineContext` (mutable context accumulated as the input moves through stages), `PipelineResult` (final outcome: committed event or structured rejection), `StageResult<T>` (generic result type for each stage), and `ResolutionAuditRequest` (the Stage 2-B trigger payload).

**`src/jus.ts`**
Defines the complete JUS (JSON UI Schema) type system: `JUSEntry` (the core mapping unit with `ui`, `opcode`, `body`, `constraints`), `JUSUIComponent` (the Telegram Bot API side: label, callback, keyboard layout), `JUSOpcodeBinding` (the Tact side: opcode hex, message body schema), `JUSConstraint` (the registered constraint identifiers: `serialization_limit`, `bounce_coverage`, `opcode_uniqueness`, `type_consistency`). This file is the formal specification of the Tact-to-Telegram mapping model.

**`src/project.ts`**
Defines `Project` (top-level entity with id, ownerId, name, status), `FileTree` (a recursive tree of `FileNode` entries, each with `path`, `content`, `hash`), `CompiledArtifact` (bytecode, ABI, BOC), and `CanonicalState` (the complete materialized project state: file tree + artifacts + deployment records + event log reference).

**`src/portal.ts`**
Defines `PortalManifest` (the deployable export bundle: compiled contract bytecode + JUS schema + Portal Bot source + README), `PortalBotConfig` (webhook URL, token, managed/self-hosted flag), and `DeploymentRecord` (mainnet transaction hash, contract address, timestamp, Stars cost).

---

### `/packages/db/` — Database Layer

```
packages/db/
├── src/
│   ├── index.ts
│   └── client.ts
├── package.json
└── tsconfig.json
```

**`package.json`**
The package manifest for the database layer. Declares the `@base44/sdk` dependency.

**`src/client.ts`**
Exports a singleton Base44 SDK client instance.

**`src/index.ts`**
Re-exports the Base44 client and selected typed wrappers for entities (e.g. `MutationEvent`, `Project`) that are useful across packages.

---

### `/packages/event-log/` — Hash-Linked Append-Only Event Log

```
packages/event-log/
├── src/
│   ├── index.ts
│   ├── EventLog.ts
│   ├── MutationEvent.ts
│   ├── serializer.ts
│   └── replayer.ts
├── package.json
└── tsconfig.json
```

This is the most critical package in the system. It is the authoritative record of every state transition. It interacts with `@temix/db` for persistence and `@temix/types` for shape definitions.

**`src/EventLog.ts`**
The `EventLog` class. Core methods: `append(payload: MutationPayload): Promise<MutationEvent>` — validates that the incoming payload is non-null, calls the serializer, computes the hash chain, persists via `@temix/db`, and returns the committed event. `getHead(projectId): Promise<MutationEvent | null>` — returns the most recent committed event. `replay(projectId): AsyncIterable<MutationEvent>` — streams all committed events in order for a given project, enabling full state reconstruction. `reject(payload, reason): Promise<void>` — records a rejected event in the log without mutating canonical state, preserving the complete history including failures. **The `append` method is the only legitimate entry point for state mutation in the entire system.**

**`src/MutationEvent.ts`**
Handles event construction and hash-chain logic. `buildEvent(payload, prevEvent)` produces a `MutationEvent` with: a UUID `id`, a SHA-256 hash computed over the canonical serialization of the payload concatenated with `prevEvent.hash` (or `genesis` for the first event), the `prevHash` reference, and a Unix millisecond timestamp. This is the cryptographic backbone of the event log's immutability guarantee.

**`src/serializer.ts`**
Produces the canonical serialization of any `MutationPayload`. Canonical means: keys sorted lexicographically, no optional fields omitted (they are replaced with `null`), no floating-point values (all numeric fields use integer representations). This determinism is what makes the hash chain reproducible — two identical payloads must always produce the same serialization, regardless of the JavaScript runtime's object key ordering.

**`src/replayer.ts`**
The `Replayer` class. `replay(projectId): Promise<CanonicalState>` streams events from `EventLog.replay()` and applies each one in sequence to an accumulating state object. This is the pure function at the heart of the system — given the same event log, it always produces the same state. Called by the Materializer (Stage 5) and by the Mini App API when a fresh project view is requested.

---

### `/packages/pipeline/` — Six-Stage Deterministic Pipeline

```
packages/pipeline/
├── src/
│   ├── index.ts
│   ├── Pipeline.ts
│   ├── PipelineContext.ts
│   └── stages/
│       ├── Stage1Submission.ts
│       ├── Stage2Resolution.ts
│       ├── Stage2BResolutionAudit.ts
│       ├── Stage3Validation.ts
│       ├── Stage4Commit.ts
│       ├── Stage5Materialization.ts
│       └── Stage6Exposure.ts
├── package.json
└── tsconfig.json
```

This package is the execution backbone of Temix. Every developer input — from any surface — enters here and either exits as a committed event or a structured rejection. It depends on `@temix/ai-engine`, `@temix/constraints-engine`, `@temix/event-log`, `@temix/materializer`, and `@temix/portal-generator`.

**`src/PipelineContext.ts`**
Defines the `PipelineContext` object that is threaded through all six stages. Contains: `input` (the raw `PipelineInput`), `resolution` (the `ResolutionOutput` from Stage 2 if successful), `validationResult` (the `ValidationResult` from Stage 3), `event` (the committed `MutationEvent` from Stage 4), `projectId`, `userId`, and `flags` (e.g. `safetyModeEnabled`). Stages may only write to their designated fields — this is enforced via TypeScript's `Readonly<>` wrappers on upstream fields.

**`src/Pipeline.ts`**
The `Pipeline` class. The single public method is `execute(input: PipelineInput): Promise<PipelineResult>`. Internally, it runs each stage in sequence, checking for early exits (Stage 2 → 2-B branch, Stage 3 → hard block). If any stage returns a failure, the pipeline halts and returns a `PipelineResult` with `status: 'rejected'` and a structured `IssueCard`. No stage can be skipped — this is enforced structurally, not by convention. The `execute` method is designed to be called from both the Telegram bot handler and the Mini App API, ensuring that both write surfaces use identical logic.

**`src/stages/Stage1Submission.ts`**
Timestamps and ingests the raw input. Assigns a submission ID. Validates that the input belongs to an active project. Checks rate limits (delegating to a rate-limit utility). Returns `StageResult<SubmissionRecord>`. This stage never fails silently — if the input is malformed, it returns a rejection before any downstream stage is invoked.

**`src/stages/Stage2Resolution.ts`**
The only non-deterministic stage. Calls `@temix/ai-engine`'s `resolver.resolve(input, projectContext)` to produce a `ResolutionOutput`: a Tact code delta and a JUS entry candidate. If the AI engine returns a `PartialResolution` (mappings it could not complete), the stage returns `StageResult<Stage2BRequest>` which causes the Pipeline to branch to Stage 2-B instead of proceeding to Stage 3.

**`src/stages/Stage2BResolutionAudit.ts`**
Handles the Resolution Audit branch. Formats the `PartialResolution` into a `ResolutionAuditCard` — a structured prompt surfaced to the developer via the Telegram bot asking for the explicit mapping that the AI could not resolve. The pipeline is suspended (the context is persisted to the database with `status: 'awaiting_audit'`) until the developer responds. When the response arrives, it is treated as a new `PipelineInput` tagged with the audit session ID, and the pipeline resumes from Stage 3.

**`src/stages/Stage3Validation.ts`**
Passes the `ResolutionOutput` to `@temix/constraints-engine`. If any deterministic check fails, returns a `StageResult` with `status: 'hard_block'` and the specific constraint violations. If AI-assisted checks produce warnings, they are attached to the context but do not block progression. If `safetyModeEnabled` is true, warnings are escalated to hard blocks.

**`src/stages/Stage4Commit.ts`**
Calls `@temix/event-log`'s `EventLog.append()` with the validated `MutationPayload`. This is the atomic commit. If the database write fails, Stage 4 returns a failure — the state is never partially committed. On success, the committed `MutationEvent` (with its hash) is written to the `PipelineContext`.

**`src/stages/Stage5Materialization.ts`**
Calls `@temix/materializer`'s `Materializer.apply(event)` to incrementally update the canonical file tree. This is an incremental update (not a full replay) for performance — the materializer maintains a cached state and applies the new event as a delta. Also triggers a WebSocket notification to connected Mini App clients that the project state has changed.

**`src/stages/Stage6Exposure.ts`**
If the project has a live Portal Bot, calls `@temix/portal-generator` to regenerate and push the updated bot interface. If the project is in `deployment_ready` state, generates a new `PortalManifest` and makes it available for download. This stage is always reached last and constitutes the public effect of a successful pipeline execution.

---

### Stage 2-B: Resolution Audit — First-Class Pipeline Branch

Stage 2-B is not an error handler. It is a first-class pipeline state — the protocol's designed response to the boundary condition where the AI Engine reaches the edge of deterministic inference and stops rather than guessing.

**When Stage 2-B is entered:**

Stage 2-B is triggered when `Stage2Resolution.ts` receives a `PartialResolution` from the AI Engine — specifically when `@temix/jus`'s `mapper.ts` returns a `PartialJUSEntry` with one or more unresolved fields. This occurs under three conditions:

- **Type ambiguity:** The Tact receive handler uses a custom message type that cannot be unambiguously mapped to a JUS body field without developer confirmation of the intended serialization.
- **Cell overflow risk:** The message body as inferred would approach but not definitively exceed the 1023-bit TVM cell limit — the system does not guess which fields to truncate.
- **Opcode unavailability:** The AI Engine cannot resolve a unique opcode for the new handler without the developer specifying the hex value explicitly.

**Pipeline suspension:**

When Stage 2-B is entered, the `PipelineContext` is persisted to the database with `status: 'awaiting_audit'` and a generated `auditSessionId`. The pipeline is suspended — no further stages execute, and the canonical state is not mutated. The `Stage2BResolutionAudit.ts` stage formats a `ResolutionAuditCard` and surfaces it to the developer via the Telegram bot as an inline keyboard prompt with a free-text response input.

**Resumption:**

When the developer responds, the response is ingested as a new `PipelineInput` tagged with the `auditSessionId`. Stage 1 recognizes the audit tag and routes the input directly to Stage 3, bypassing Stage 2 entirely. The developer's explicit mapping is treated as authoritative resolution. It is not re-evaluated by the AI Engine.

**What Stage 2-B is not:**

Stage 2-B is not a fallback or a degraded mode. It is the protocol's commitment that partial knowledge never enters the event log. A `PartialResolution` that proceeds silently to Stage 3 would produce a `HardBlock` at the constraints layer — Stage 2-B simply surfaces that block earlier, at the point of ambiguity, with actionable developer input rather than a constraint violation error.

**Testing:**

`Stage2BResolutionAudit.ts` must have 100% unit test coverage alongside `event-log` and `constraints-engine`. The audit suspension/resumption lifecycle, the `auditSessionId` binding, and the Stage 3 re-entry path are all independently testable with mocked pipeline contexts and require no live AI Engine.

---

### `/packages/ai-engine/` — Hybrid AI Engine (DeepSeek)

```
packages/ai-engine/
├── src/
│   ├── index.ts
│   ├── DeepSeekClient.ts
│   ├── resolver.ts
│   ├── parser.ts
│   └── prompts/
│       ├── index.ts
│       ├── tactDelta.ts
│       ├── jusMapping.ts
│       └── mergeAssistant.ts
├── package.json
└── tsconfig.json
```

This package is intentionally isolated. It is called by `@temix/pipeline` at Stage 2 and nowhere else. Its job is to translate developer intent into a structured resolution candidate. It does not validate, commit, or mutate anything.

**`src/DeepSeekClient.ts`**
A typed wrapper around the DeepSeek API (compatible with the OpenAI SDK interface, which DeepSeek supports). Manages: API key injection from environment, request retry logic with exponential backoff (up to 3 retries), timeout enforcement (15 seconds per call), and structured JSON response mode enforcement via DeepSeek's `response_format: { type: 'json_object' }` parameter. All calls to DeepSeek in the codebase go through this client.

**`src/resolver.ts`**
The `resolver.resolve(input, projectContext)` function. Selects the appropriate prompts based on input type (declarative natural language vs. direct Tact/JUS syntax), calls `DeepSeekClient`, and passes the raw response to `parser.ts`. Returns a `ResolutionOutput` (success) or `PartialResolution` (failure requiring Stage 2-B). The `projectContext` includes the current file tree, existing JUS entries, and recent event log entries — this is what gives DeepSeek awareness of the project's current state.

**`src/parser.ts`**
Takes the raw DeepSeek JSON response and produces a typed `ResolutionOutput` or throws a `ParserError`. Validates that the response contains both a `tactDelta` field and a `jusEntry` field. Does not validate correctness (that is Stage 3's job) — only validates that the response is structurally parseable. If parsing fails, the pipeline treats it identically to a `PartialResolution` and routes to Stage 2-B.

**`src/prompts/tactDelta.ts`**
The system and user prompt templates for Tact code generation. The system prompt includes: the current project's full file tree (injected at call time), the registered JUS schema (so DeepSeek knows which opcodes are already claimed), and the TON Tact language specification subset relevant to receive handlers and message types. The user prompt is the developer's intent statement.

**`src/prompts/jusMapping.ts`**
The prompt template for JUS entry generation. Given a Tact receive handler (either newly generated or pre-existing), instructs DeepSeek to produce the corresponding JUS entry. Includes the full JUS type specification and several few-shot examples of correct Tact → JUS mappings.

**`src/prompts/mergeAssistant.ts`**
The prompt template used during three-way conflict resolution (Section 8 of the white paper). Given the three versions (common ancestor, AI-generated, human-edited), instructs DeepSeek to produce a plain-language explanation of the implications of each version — specifically calling out gas, bounce behavior, and type safety differences. This output is surfaced to the developer in the Mini App's `ThreeWayDiff` component.

---

### `/packages/constraints-engine/` — Semantic Constraints Engine

```
packages/constraints-engine/
├── src/
│   ├── index.ts
│   ├── ConstraintsEngine.ts
│   ├── IssueCard.ts
│   ├── deterministic/
│   │   ├── index.ts
│   │   ├── opcodeUniqueness.ts
│   │   ├── serializationLimit.ts
│   │   └── typeConsistency.ts
│   └── heuristic/
│       ├── index.ts
│       ├── gasSafety.ts
│       ├── bounceLogic.ts
│       └── reentrancy.ts
├── package.json
└── tsconfig.json
```

The enforcement layer of the protocol. Stateless. Every function in this package is a pure function that takes a `ResolutionOutput` and returns a pass/fail/warn result. It has no knowledge of the event log, the database, or the AI engine.

**`src/ConstraintsEngine.ts`**
The `ConstraintsEngine` class. The single public method is `validate(resolution: ResolutionOutput, context: ValidationContext, flags: ValidationFlags): ValidationResult`. Runs all deterministic checks first. If any deterministic check fails, stops immediately and returns `ValidationResult { status: 'hard_block', violations: ConstraintViolation[] }`. If all deterministic checks pass, runs heuristic checks. If Safety Mode is enabled (`flags.safetyMode === true`), heuristic warnings are promoted to hard blocks.

**`src/IssueCard.ts`**
Defines and constructs `IssueCard` — the structured diagnostic record surfaced to the developer when validation fails. Fields: `violationType` (deterministic or heuristic), `constraintId` (the specific constraint that failed), `humanReadableMessage` (plain English description of the violation), `affectedField` (the JUS or Tact field that caused the failure), `suggestedCorrection` (a concrete fix recommendation). This is the structure that both the Telegram bot and the Mini App consume to display error state.

**`src/deterministic/opcodeUniqueness.ts`**
Checks that the opcode in the incoming JUS entry does not collide with any opcode in the current project's committed JUS schema. Queries the `ValidationContext.existingJUSEntries` (passed in, not fetched) to avoid database calls inside the constraint layer. Returns `Pass` or `HardBlock` with the colliding opcode hex and the handler name it is already bound to.

**`src/deterministic/serializationLimit.ts`**
Validates that the message body defined in the JUS entry, when serialized according to TVM cell encoding rules, fits within the 1023-bit cell limit. Implements the TVM bit-width calculation for each supported Tact type (`Int as coins` = 124 bits, `Address` = 267 bits, etc.). Returns `Pass` or `HardBlock` with the calculated bit count and the overage amount.

**`src/deterministic/typeConsistency.ts`**
Cross-validates the data types declared in the JUS `body` field against the parameter types declared in the corresponding Tact `receive` handler. For example, if the JUS entry declares `amount: "coins"` but the Tact handler expects `amount: Int as uint64`, this is a `HardBlock`. Uses the Tact type system's canonical type names for comparison.

**`src/heuristic/gasSafety.ts`**
Estimates whether the message chain implied by the JUS entry is likely to exceed standard gas limits. Uses a lookup table of approximate gas costs per Tact operation (from TON documentation) and prior sandbox trace data from the `ValidationContext`. Returns `Pass` or `Warn` with an estimated gas range and a reference to the relevant TON gas pricing schedule.

**`src/heuristic/bounceLogic.ts`**
Inspects the Tact delta for outgoing `send()` calls that lack a corresponding `bounced` handler in the contract. If an outgoing message has no bounce handler and the JUS entry does not declare a `bounce_coverage` constraint, returns `Warn` with the specific send call that lacks coverage.

**`src/heuristic/reentrancy.ts`**
Identifies message sequences in the Tact delta that resemble known reentrancy risk patterns in TON's actor model — specifically, contracts that send messages to other contracts and then rely on state that could be modified by a re-entrant call before the response arrives. Returns `Pass` or `Warn` with the identified pattern and the relevant TON actor-model documentation reference.

---

### `/packages/jus/` — JSON UI Schema System

```
packages/jus/
├── src/
│   ├── index.ts
│   ├── JUSSchema.ts
│   ├── mapper.ts
│   ├── validator.ts
│   └── generator.ts
├── package.json
└── tsconfig.json
```

The synchronization standard that keeps the Portal Bot in continuous sync with the underlying contract. The most precise expression of Temix's core technical contribution.

**`src/JUSSchema.ts`**
Defines the runtime representation of the JUS schema for a project — a `Map<opcodeHex, JUSEntry>`. Exposes: `add(entry)`, `get(opcode)`, `has(opcode)`, `toArray()`, `fromEvents(events)` (reconstructs the schema from an event log replay). This class is used by the constraints engine, the portal generator, and the materializer.

**`src/mapper.ts`**
`mapHandlerToJUS(handler: TactReceiveHandler, context: ProjectContext): JUSEntry | PartialJUSEntry`. Takes a parsed Tact receive handler and produces the corresponding JUS entry. If all fields can be deterministically mapped (types are simple, opcodes are unique), returns a full `JUSEntry`. If any field requires ambiguity resolution (complex serialization, unknown custom types), returns a `PartialJUSEntry` with the unresolved fields annotated — this is what triggers Stage 2-B.

**`src/validator.ts`**
Validates a candidate `JUSEntry` against the JUS specification. This is a lightweight pre-check called before the full `ConstraintsEngine` validation. Checks structural validity: all required fields are present, the callback string is non-empty and URL-safe, the opcode is a valid 32-bit hex string.

**`src/generator.ts`**
`generateTelegramComponents(schema: JUSSchema): TelegramBotAPIConfig`. Produces the Telegram Bot API configuration (InlineKeyboardMarkup layout, CallbackQuery handlers) directly from the JUS schema. This is the function called at Stage 6 to update the Portal Bot's live interface. The output is a deterministic, typed representation of the bot's full keyboard structure.

---

### `/packages/materializer/` — State Materialization Engine

```
packages/materializer/
├── src/
│   ├── index.ts
│   ├── Materializer.ts
│   ├── FileTreeBuilder.ts
│   └── ArtifactStore.ts
├── package.json
└── tsconfig.json
```

Translates the event log into the canonical file tree and compiled artifacts. Called at Stage 5.

**`src/Materializer.ts`**
The `Materializer` class. Two modes of operation: `apply(event)` for incremental updates (Stage 5 — single new event applied to cached state), and `rebuild(projectId)` for full replay from the event log (used when the cache is cold or after a rollback). Maintains an in-memory `CanonicalState` cache per project, keyed by `projectId`. Notifies subscribers (WebSocket connections) when state changes.

**`src/FileTreeBuilder.ts`**
Applies individual `MutationEvent` payloads to a `FileTree`. Handles: `TactDeltaEvent` (patches a `.tact` file's content using a unified diff format), `JUSEntryEvent` (updates the `.jus.json` schema file), `RollbackEvent` (resets the tree to the state at the target event hash by replaying from genesis to that point). All file mutations produce a new hash for the affected `FileNode`, enabling cheap change detection.

**`src/ArtifactStore.ts`**
Manages compiled contract artifacts (BOC bytecode, ABI JSON). When a Tact delta event is materialized, `ArtifactStore` marks the current artifacts as `stale`. Stale artifacts are recompiled on-demand by `@temix/tact-compiler` when a deployment is requested. Stores artifacts in the database with a reference to the event hash that produced them, enabling artifact-to-source traceability.

---

### `/packages/tact-compiler/` — Tact Compilation Wrapper

```
packages/tact-compiler/
├── src/
│   ├── index.ts
│   ├── compiler.ts
│   ├── artifacts.ts
│   └── diagnostics.ts
├── package.json
└── tsconfig.json
```

**`src/compiler.ts`**
Wraps the Blueprint/Tact compiler toolchain. `compile(fileTree: FileTree): Promise<CompilationResult>`. Writes the materialized file tree to a temporary directory, invokes the Tact compiler via child process, and collects the output (BOC, ABI, FunC intermediate). Returns a typed `CompilationResult` with success/failure status. On failure, passes the raw compiler output to `diagnostics.ts`. The temporary directory is always cleaned up, regardless of success or failure.

**`src/artifacts.ts`**
Types and utilities for handling `CompiledArtifact` objects: the BOC bytecode buffer, the ABI JSON, the FunC intermediate source (for advanced debugging), and the compilation metadata (compiler version, optimization flags).

**`src/diagnostics.ts`**
Translates raw Tact compiler error output into structured `CompilerDiagnostic` objects (file path, line number, column, error message, severity). These diagnostics are displayed in the Mini App's file editor and surfaced as `IssueCard` entries in the Telegram bot interface.

---

### `/packages/sandbox/` — TON Sandbox + Temporal Timeline Layer

```
packages/sandbox/
├── src/
│   ├── index.ts
│   ├── SandboxRunner.ts
│   ├── TemporalTimeline.ts
│   ├── MainnetSimulation.ts
│   └── GasTracer.ts
├── package.json
└── tsconfig.json
```

**`src/SandboxRunner.ts`**
Wraps `@ton/sandbox` (Blueprint's sandbox environment). `run(artifact: CompiledArtifact, scenario: TestScenario): Promise<SandboxResult>`. Deploys the compiled contract to the sandbox, executes the provided test scenario (a sequence of messages), and collects the full transaction trace. The raw transaction trace is passed to `TemporalTimeline.ts` for structuring. Explicitly documents the fidelity ceiling: zero-latency internal messages, single-threaded execution, no cross-shard routing.

**`src/TemporalTimeline.ts`**
Transforms the raw `@ton/sandbox` transaction trace into the structured `TimelineView` consumed by the Mini App's `TemporalTimeline` component. Each `TimelineStep` includes: the sender and receiver contract addresses, the message opcode, the message value, the gas consumed at this step, and the cumulative timestamp. The `TimelineView` is an ordered array of `TimelineStep` entries, enabling the scrubbing interface in the Mini App.

**`src/MainnetSimulation.ts`**
Implements the Mainnet Simulation Mode described in Section 7.2 of the white paper. `injectSimulation(timeline: TimelineView, config: SimulationConfig): SimulatedTimeline`. Applies: artificial 2-5 second jitter intervals between internal message steps (sampled from a configurable distribution), randomized message delivery ordering within concurrent message groups. Returns a `SimulatedTimeline` with the injected delays annotated and a `RaceConditionReport` if timing dependencies that could fail on mainnet are detected. The interface explicitly labels simulated results as non-faithful mainnet replicas.

**`src/GasTracer.ts`**
Extracts per-step gas consumption from the `@ton/sandbox` transaction trace. `trace(sandboxResult): GasTrace`. Produces a `GasTrace` — an array of `GasStep` objects, each with the operation, the gas consumed, and a `withinSafeLimit` boolean (compared against the standard TON gas pricing schedule). This output feeds both the Mini App's timeline view and the constraints engine's `gasSafety` heuristic.

---

### `/packages/portal-generator/` — Portal Bot + Manifest + Git Export

```
packages/portal-generator/
├── src/
│   ├── index.ts
│   ├── ManifestBuilder.ts
│   ├── BotGenerator.ts
│   ├── GitExporter.ts
│   └── templates/
│       ├── bot.template.ts
│       └── readme.template.ts
├── package.json
└── tsconfig.json
```

The implementation of the Minimality Principle. At any point in a project's lifecycle, these functions produce a complete, self-contained, runnable export.

**`src/ManifestBuilder.ts`**
`buildManifest(state: CanonicalState): PortalManifest`. Assembles the deployable bundle: compiled contract BOC, the full JUS schema as a JSON file, the generated Portal Bot source code (from `BotGenerator.ts`), and a README. The manifest is also serialized as a zip archive for download. This is the artifact that enables both the managed deployment path (Stars) and the self-hosted path (Git export).

**`src/BotGenerator.ts`**
`generateBotSource(jusSchema: JUSSchema, config: PortalBotConfig): BotSource`. Uses the JUS schema to generate a complete, runnable Telegram bot — a Node.js/TypeScript project using `grammy` as the bot framework. The generated bot handles all `CallbackQuery` events registered in the JUS schema and routes them to the corresponding TON contract calls via `@ton/ton`. The output is 100% standard TypeScript — no Temix runtime dependency.

**`src/GitExporter.ts`**
`exportToGit(state: CanonicalState, manifest: PortalManifest): GitBundle`. Reconstructs the project's development history as a standard Git repository. Each `MutationEvent` in the event log becomes a Git commit, with the event hash as the commit hash reference in the message. The result is a `.tar.gz` Git bundle that a developer can `git clone` and immediately push to GitHub or any Git remote.

**`src/templates/bot.template.ts`**
The code template for the generated Portal Bot. A `grammy`-based Telegram bot with: webhook setup, `CallbackQuery` router (populated from the JUS schema at generation time), TON wallet integration for signing and sending contract messages, and error handling. Written as a template literal with typed injection points for JUS-derived values.

**`src/templates/readme.template.ts`**
The README template for the exported project. Populated with: the contract address (if deployed), setup instructions for self-hosting the Portal Bot, the Stars-to-managed-hosting alternative, and a link to the Temix documentation.

---

### `/apps/api/` — Backend API Server

```
apps/api/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── projects.ts
│   │   ├── pipeline.ts
│   │   ├── events.ts
│   │   └── deployment.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── error.ts
│   │   └── rateLimit.ts
│   └── websocket/
│       ├── index.ts
│       └── handlers.ts
├── package.json
└── tsconfig.json
```

The CQRS orchestrator. The central nervous system connecting all packages to all client surfaces. Built on Fastify for performance and TypeScript-first schema validation.

**`src/server.ts`**
Fastify server setup. Registers plugins: `@fastify/cors` (Mini App origin), `@fastify/jwt` (Telegram user authentication via `initData` validation), `@fastify/websocket` (Mini App real-time updates), `@fastify/rate-limit` (pipeline submission throttling). Mounts all route modules.

**`src/routes/pipeline.ts`**
`POST /pipeline/submit` — the write endpoint. Accepts a `PipelineInput` from the Mini App (the Telegram bot has its own direct pipeline call via the bot handler). Validates the JWT, constructs the `PipelineInput`, calls `Pipeline.execute()`, and returns the `PipelineResult`. If the result is a `Stage2BRequest`, returns a `202 Accepted` with the audit session ID. This route is the Mini App's equivalent of the Telegram chat write surface.

**`src/routes/projects.ts`**
`GET /projects/:id/state` — returns the current `CanonicalState` for the Mini App's file tree and portal preview. `GET /projects/:id/timeline` — returns the last N `TimelineView` entries. `POST /projects/:id/rollback` — submits a rollback intent to the pipeline (processed as a `RollbackEvent`, not a direct mutation). `GET /projects/:id/manifest` — returns the current `PortalManifest` for download.

**`src/routes/events.ts`**
`GET /projects/:id/events` — paginated event log query endpoint for the Mini App's `EventLog` component. Supports cursor-based pagination and filtering by event type.

**`src/routes/deployment.ts`**
`POST /projects/:id/deploy` — initiates a mainnet deployment. Validates that Stars credits are sufficient, calls `@temix/tact-compiler` for a final compilation, submits the deployment transaction to TON, and records the `DeploymentRecord`. `POST /projects/:id/portal/instantiate` — instantiates a managed Portal Bot via `apps/portal-runtime`.

**`src/websocket/handlers.ts`**
WebSocket connection handler for real-time Mini App updates. On Stage 5 completion, the `Materializer` emits a `state_updated` event. The WebSocket handler picks this up and broadcasts the updated `CanonicalState` to all connected clients subscribed to that `projectId`. This is what makes the Mini App feel live — file tree and portal preview update immediately when a pipeline completes.

---

### `/apps/telegram-bot/` — Command Interface (Write Side)

```
apps/telegram-bot/
├── src/
│   ├── index.ts
│   ├── bot.ts
│   ├── commands/
│   │   ├── index.ts
│   │   ├── start.ts
│   │   ├── new.ts
│   │   ├── deploy.ts
│   │   └── export.ts
│   ├── handlers/
│   │   ├── message.ts
│   │   ├── callback.ts
│   │   └── conflict.ts
│   ├── middleware/
│   │   ├── session.ts
│   │   └── auth.ts
│   └── views/
│       ├── issueCard.ts
│       ├── pipelineStatus.ts
│       └── deploymentResult.ts
├── package.json
└── tsconfig.json
```

The write side of the CQRS system. Every message sent to the Temix bot is an intent expression. This app translates Telegram events into `PipelineInput` and surfaces `PipelineResult` back to the developer.

**`src/bot.ts`**
Telegraf bot initialization. Registers all command handlers, message handlers, and callback query handlers. Configures webhook mode (production) vs. long-polling mode (development). The bot's Telegram token is injected from environment.

**`src/handlers/message.ts`**
The primary message handler. Every text message not matching a command is treated as a developer intent statement. Constructs a `PipelineInput` with `type: 'declarative'`, adds the project context from the session, calls `Pipeline.execute()` directly (not via the API — the bot has direct package access for lower latency), and dispatches the result to the appropriate view.

**`src/handlers/conflict.ts`**
Handles the three-way diff resolution flow. When the Mini App submits a conflict that requires developer resolution, the bot sends an inline keyboard presenting the two options (AI version vs. human version), with the DeepSeek merge assistant's explanation as the message body. The developer's button selection is processed as a `ConflictResolutionEvent` through the pipeline.

**`src/views/issueCard.ts`**
Formats a `IssueCard` from the constraints engine into a Telegram message. Uses Telegram's MarkdownV2 formatting: the constraint ID is bold, the human-readable message is in a code block, and the suggested correction is a bulleted action item. Includes an inline keyboard with a "Try again" button that reopens the relevant input prompt.

**`src/views/pipelineStatus.ts`**
Formats pipeline progress updates as Telegram messages. For long-running pipeline executions (DeepSeek calls can take 3-8 seconds), sends a "thinking" message immediately on submission and edits it in-place as stages complete. Uses Telegram's `editMessageText` to avoid flooding the chat with status updates.

---

### `/apps/mini-app/` — Mini App Dashboard (Read Side)

```
apps/mini-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── FileTreeInspector/
│   │   │   ├── index.tsx
│   │   │   ├── FileNode.tsx
│   │   │   └── FileEditor.tsx
│   │   ├── TemporalTimeline/
│   │   │   ├── index.tsx
│   │   │   ├── MessageStep.tsx
│   │   │   └── SimulationControls.tsx
│   │   ├── ThreeWayDiff/
│   │   │   ├── index.tsx
│   │   │   ├── DiffPanel.tsx
│   │   │   └── CommitSignal.tsx
│   │   ├── PortalPreview/
│   │   │   ├── index.tsx
│   │   │   └── BotMockup.tsx
│   │   └── EventLog/
│   │       ├── index.tsx
│   │       └── EventEntry.tsx
│   ├── hooks/
│   │   ├── useProject.ts
│   │   ├── useEventLog.ts
│   │   └── useWebSocket.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── projectSlice.ts
│   │   └── pipelineSlice.ts
│   └── api/
│       └── client.ts
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

The query side of the CQRS system. Built with React + Vite. Initialized via the Telegram Mini App SDK (`window.Telegram.WebApp`). Displays state only — all edits are submitted as pipeline commands via the API.

**`src/components/FileTreeInspector/index.tsx`**
Renders the project file tree from `CanonicalState.fileTree`. Files can be opened for editing in `FileEditor.tsx`. When the developer saves an edit, the changed content is submitted as a `PipelineInput` (type: `direct`, subtype: `manual_edit`) via the API — never written directly to state. Updated via WebSocket on every Stage 5 completion.

**`src/components/TemporalTimeline/index.tsx`**
The scrubbing interface for the `TimelineView`. Renders each `TimelineStep` as a node on a vertical timeline. The scrub handle can be dragged to any point in the timeline, updating the detailed step view. `SimulationControls.tsx` exposes the Mainnet Simulation Mode toggle and the simulation configuration (jitter range, ordering randomization). Clearly labels sandbox vs. simulation mode in the UI.

**`src/components/ThreeWayDiff/index.tsx`**
Renders the three-panel conflict resolution view: the common ancestor, the AI-generated version, and the human-edited version. Each panel uses a syntax-highlighted diff view. The DeepSeek merge assistant's explanation is displayed above the panels. `CommitSignal.tsx` renders the explicit commit button — the merge cannot proceed without it.

**`src/components/PortalPreview/BotMockup.tsx`**
A static mockup of the Telegram bot interface as it would appear to an end user, rendered from the current `JUSSchema` via `@temix/jus`'s `generateTelegramComponents()`. Buttons are non-interactive (this is a preview, not a live bot). Updates in real-time as the JUS schema changes.

**`src/hooks/useWebSocket.ts`**
Manages the WebSocket connection to `apps/api`'s WebSocket server. Subscribes to `state_updated` events for the current project. On receiving an update, dispatches to the Redux store, triggering re-renders in all components that depend on project state.

---

### `/apps/portal-runtime/` — Managed Portal Bot Hosting

```
apps/portal-runtime/
├── src/
│   ├── index.ts
│   ├── runtime.ts
│   ├── webhook.ts
│   ├── persistence.ts
│   └── health.ts
├── package.json
└── tsconfig.json
```

The Stars-funded operational service. Manages the lifecycle of deployed Portal Bot instances on Temix-managed infrastructure.

**`src/runtime.ts`**
`BotRuntime` class. Manages a registry of active Portal Bot instances (one per deployed project). `instantiate(manifest: PortalManifest, config: PortalBotConfig)` — starts a new bot instance from a `PortalManifest`, registers its webhook, and begins tracking its uptime. `terminate(projectId)` — gracefully shuts down a bot instance and de-registers its webhook. Each instance runs in an isolated worker thread to prevent one bot's failure from affecting others.

**`src/webhook.ts`**
Handles Telegram webhook registration and management for managed bots. Registers the bot's webhook URL with the Telegram Bot API on instantiation and rotates the webhook secret on a configurable schedule. Also handles the `setWebhookInfo` polling to detect and recover from failed webhook deliveries.

**`src/persistence.ts`**
Manages bot state persistence for managed instances. Stores per-user, per-bot session state (conversation context, pending transaction state) in Redis. This is the "state persistence" component of the Stars-funded managed hosting described in Section 9.3 of the white paper.

**`src/health.ts`**
Health check and uptime monitoring for managed bot instances. Pings each active bot's webhook endpoint on a 60-second interval. On failure, attempts automatic restart (up to 3 times). On repeated failure, marks the bot as `degraded` in the database and sends a Telegram notification to the project owner.

---

### Managed Hosting SLA and Operational Guarantees

The `portal-runtime` is the Stars-funded operational service. Its guarantees must be explicitly specified, not assumed from the health check interval alone.

**Uptime target:** 99.5% monthly availability per managed bot instance. This is calculated per-bot, not per-platform. A platform-wide outage counts against all affected bots' individual SLAs.

**Degraded state definition:** A bot is marked `degraded` after 3 consecutive failed health checks (3-minute window). The project owner receives a Telegram notification immediately on degraded status. A degraded bot is not billed at the managed hosting rate for the duration of the degraded period.

**Recovery SLA:** Automatic recovery is attempted immediately on degraded detection via `src/health.ts`. If automatic recovery fails within 5 minutes, the bot is placed in `manual_recovery` state and flagged for operator intervention. The developer retains the option to self-hosted at any point during or after a degraded period at zero additional cost — the `PortalManifest` is always available for export.

**State persistence guarantee:** Per-user, per-bot session state (stored in Redis via `src/persistence.ts`) is preserved across restarts and recovery events. A bot restart does not produce conversation state loss for end users.

**Rate limit handling:** The managed runtime handles Telegram Bot API rate limits (30 messages/second global, 1 message/second per chat) transparently. Queued messages during rate limit windows are delivered in order. Developers do not need to implement rate limiting in the exported bot source — this is a managed-only guarantee.

**Scope of guarantee:** The managed hosting SLA covers webhook delivery, bot instance uptime, and session persistence. It does not cover TON mainnet availability, Telegram API availability, or DeepSeek API availability. These are external dependencies with their own SLAs.

**Billing on degraded:** Stars credits are not consumed for the period a bot instance is in `degraded` or `manual_recovery` state. The billing clock resumes on confirmed recovery.

---

## Package Dependency Graph

```
@temix/types          (no internal deps)
     │
     ├──► @temix/db
     │
     ├──► @temix/event-log   ──► @temix/db
     │
     ├──► @temix/jus
     │
     ├──► @temix/constraints-engine  ──► @temix/jus, @temix/types
     │
     ├──► @temix/ai-engine    ──► @temix/types
     │
     ├──► @temix/tact-compiler ──► @temix/types
     │
     ├──► @temix/sandbox       ──► @temix/types, @temix/tact-compiler
     │
     ├──► @temix/materializer  ──► @temix/event-log, @temix/jus, @temix/types
     │
     ├──► @temix/portal-generator ──► @temix/jus, @temix/types
     │
     └──► @temix/pipeline      ──► ALL packages above
              │
              ├──► apps/api          ──► @temix/pipeline, @temix/db
              ├──► apps/telegram-bot ──► @temix/pipeline
              ├──► apps/mini-app     ──► (API calls only, no direct package deps)
              └──► apps/portal-runtime ──► @temix/portal-generator
```

---

## The Critical Path: A Single Developer Command

To ground the file tree in the actual execution flow, here is the path a single natural-language message takes through the system:

```
Developer types "Add a Transfer button" in Telegram
│
└─► apps/telegram-bot/src/handlers/message.ts
      │  constructs PipelineInput
      │
      └─► packages/pipeline/src/stages/Stage1Submission.ts
            │  timestamps, ingests, validates
            │
            └─► packages/pipeline/src/stages/Stage2Resolution.ts
                  │  calls packages/ai-engine/src/resolver.ts
                  │  DeepSeek generates Tact delta + JUS entry candidate
                  │
                  └─► packages/pipeline/src/stages/Stage3Validation.ts
                        │  calls packages/constraints-engine/src/ConstraintsEngine.ts
                        │  deterministic checks run (opcode, cell size, types)
                        │  PASS
                        │
                        └─► packages/pipeline/src/stages/Stage4Commit.ts
                              │  calls packages/event-log/src/EventLog.ts
                              │  event appended to hash-linked log
                              │  persisted to packages/db (Base44)
                              │
                              └─► packages/pipeline/src/stages/Stage5Materialization.ts
                                    │  calls packages/materializer/src/Materializer.ts
                                    │  file tree updated, JUS schema updated
                                    │  WebSocket broadcast → apps/mini-app updates live
                                    │
                                    └─► packages/pipeline/src/stages/Stage6Exposure.ts
                                          │  calls packages/portal-generator
                                          │  Portal Bot interface updated
                                          │
                                          └─► apps/telegram-bot/src/views/pipelineStatus.ts
                                                "✓ Transfer button added. Event #47."
```

---

*Architecture version 1.0 — Temix Protocol White Paper v1.0 compliant.*
*Every file in this tree has a single, declared responsibility. No file exists without a named role in the pipeline.*
