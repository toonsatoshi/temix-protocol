 Temix Protocol

White Paper — Version 1.0

Build the Protocol. Export the Portal. Own the Network.

Abstract

The Open Network (TON) represents the most ambitious convergence of blockchain infrastructure and mass-market distribution in the history of decentralized computing. With over 950 million Telegram users as its ambient user base, TON is not merely a blockchain — it is an operating system for the next generation of decentralized applications. Yet the tooling available to developers who wish to build on this network remains anchored to a paradigm built for a different era: desktop terminals, fragmented CLI workflows, and static IDEs engineered for a world that does not move at the speed of Telegram.

Temix is the corrective.

The Temix Protocol is a sovereign, unified development stack that treats the Smart Contract and the Telegram Portal as a single, deterministic unit. It is the first environment to formally close the loop between developer intent and end-user interface — from the first line of Tact code to a live, white-labeled Telegram bot running on the mainnet — within a single, coherent pipeline. Temix does not extend the existing TON toolchain. It replaces the conceptual model that made a fragmented toolchain necessary in the first place.

1. The Problem: Fragmentation at the Speed of TON

TON's actor-model architecture is both its greatest strength and its most significant developer challenge. The network's asynchronous, message-passing execution model enables extraordinary throughput and scalability. It also produces a debugging and deployment environment that is fundamentally hostile to the linear, synchronous mental models that most development tools are built around.

A developer building on TON today faces a multi-front coordination problem.

Toolchain fragmentation. The canonical path — write Tact in a local editor, compile with Blueprint CLI, deploy to testnet, debug with sandbox traces, build a Telegram bot separately using the Bot API — involves no fewer than four distinct toolchains, each with its own configuration surface, dependency graph, and failure mode. None of these tools were designed to speak to each other.

The async debugging gap. When a contract-to-contract message cascade fails on TON, the error is not thrown synchronously. Bounce handlers fire in a subsequent transaction. State changes propagate across actors. The causal chain that produced the failure is distributed across the timeline of the network itself. Static stack traces, the default debugging artifact of most IDEs, are structurally inadequate for this model. Developers are left reconstructing message flows manually from explorer data.

The interface disconnection. The Telegram bot that an end user interacts with and the smart contract it calls are treated as entirely separate concerns, built by separate tools, deployed by separate processes, and maintained on separate schedules. This means that every time a contract's interface changes, the bot that surfaces it must be manually updated. There is no deterministic link between contract logic and user interface.

The mobile penalty. Telegram is a mobile-first platform. Its developer community is correspondingly mobile-native — active in chats, responsive on phones, operating at a pace that desktop-bound tooling cannot match. The assumption that serious TON development requires a desktop terminal is not a technical requirement. It is a historical accident, and it imposes a real cost on the developers most likely to build the next generation of TON applications.

Temix resolves all four failure modes within a single architectural commitment: that the development environment should live where the developer already is.

THE CURRENT TON DEVELOPER WORKFLOW (Fragmented)
────────────────────────────────────────────────────────────────────────
 [ Local Editor ]    [ Blueprint CLI ]    [ Bot API Server ]  [ Explorer ]
       │                    │                     │                │
  Write Tact           Compile &            Build Bot          Debug txns
  source files          Deploy              manually           manually
       │                    │                     │                │
       ▼                    ▼                     ▼                ▼
  ─────────────────────────────────────────────────────────────────────
  No shared state.    No shared config.    No shared schema.  No causal link.
  ─────────────────────────────────────────────────────────────────────

  Result: 4 toolchains. 4 failure surfaces.
  0 deterministic connection between the contract and the interface that calls it.
────────────────────────────────────────────────────────────────────────

2. The Thesis: A Headless IDE for the Actor Model

The Temix Protocol is engineered around a single governing thesis: professional TON development does not require a desktop. It requires a superior interface for managing actor-model complexity.

This thesis has a precise technical implication. It means that the classical IDE — a monolithic application managing files, compiler state, debugging output, and deployment in a single desktop window — is not the right primitive for TON development. The right primitive is a system that separates developer intent from system state, manages the translation between them deterministically, and surfaces the result on whichever interface the developer is already using.

This is what Temix calls the Headless IDE paradigm.

The word "headless" does not mean featureless. It means the opposite: that every feature of a professional development environment — version control, compilation, validation, debugging, deployment, and interface generation — is available through a command surface that is decoupled from any specific visual frontend. The frontend — in this case, a Telegram chat interface and a lightweight Mini App — becomes a view into a deterministic backend engine, not the engine itself.

The architectural model that makes this possible is a formal adaptation of Command Query Responsibility Segregation (CQRS), applied to the software development lifecycle itself.

3. System Architecture: CQRS Applied to the Development Lifecycle

Temix formalizes the development workflow into two distinct planes that never conflate their responsibilities.

TEMIX: CQRS SYSTEM OVERVIEW ───────────────────────────────────────────────────────────────── [[ DEVELOPER ]] | ┌───────────────┴────────────────┐ │ WRITE (Commands) │ READ (Queries) v v ┌────────────────────────┐ ┌─────────────────────────────┐ │ COMMAND INTERFACE │ │ MINI APP DASHBOARD │ │ (Telegram Chat) │ │ (Materialized View) │ │ │ │ │ │ Natural language ────┼──┐ │ [ File Tree Inspector ] │ │ Tact syntax ────┼──┤ │ [ Portal Bot Preview ] │ │ JUS notation ────┼──┤ │ [ Temporal Timeline ] │ └────────────────────────┘ │ │ [ Three-Way Diff ] │ │ └──────────────┬──────────────┘ v ^ ┌────────────────────────┐ │ │ BACKEND ENGINE │────────┘ │ (Canonical State) │ materializes view │ │ │ Hash-Linked Event Log │ │ File Tree │ │ Compiled Artifacts │ │ Deployment Records │ └───────────┬────────────┘ │ ┌─────────┴──────────┐ v v [ PORTAL BOT ] [ TON MAINNET ] 

3.1 The Command Interface — The Decision Log

The Telegram chat is the write side of the Temix system. Every developer input — whether declaring a contract variable, defining a receive handler, or specifying a UI button — is processed as an intended state transition. These intents are immutable once recorded. They are appended, in sequence, to a hash-linked event log that constitutes the authoritative history of every decision made during a project's lifetime.

This is not a chat log. It is a commit history expressed through natural language. The distinction matters: every message that crosses the pipeline threshold is a verifiable, replayable record of developer intent, linked by cryptographic hash to the state it produced.

The Command Interface supports two input modalities:

Declarative commands: High-level intent expressed in natural language ("Add a Transfer button that calls the Jetton send handler").

Direct commands: Precise technical instructions expressed in Tact syntax or JUS schema notation for developers who prefer working at the specification level.

Both modalities pass through the same six-stage deterministic pipeline. The interface adapts to the developer; the pipeline does not.

3.2 The State Engine and Mini App — The Materialized View

The backend engine maintains the canonical project state. This state — the file tree, the compiled artifacts, the deployment records, the event log — is the ground truth of the project. It is not derived from the chat. The chat writes to it.

This canonical state is surfaced, in read-and-edit form, through the Temix Mini App — a Telegram Mini App that functions as the project's structured workspace. The Mini App provides:

A file tree inspector for navigating multi-file Tact projects.

A three-way diff interface for resolving conflicts between AI-generated suggestions and manual edits.

A Temporal Timeline Layer for tracing asynchronous message cascades (detailed in Section 5).

A Portal Preview for inspecting the current state of the generated Telegram bot interface before deployment.

The Mini App is the query side of the CQRS model. It displays state. It can also accept manual edits — which are processed as commands back through the event log, not as direct mutations to the state. This ensures that the event log remains the complete, unbroken record of every change, regardless of which interface produced it.

3.3 The Portal Bot Engine — The Manifestation Layer

The Portal Bot is Temix's most significant architectural innovation. It is the automated deployment arm of the protocol — the mechanism by which a completed Temix project becomes a live, end-user-facing product.

When a project reaches deployment readiness, Temix generates a Portal Manifest: a combined bundle containing the compiled smart contract bytecode and a complete Telegram Bot UI schema. This manifest is the deployable unit. From it, Temix can instantiate a standalone, white-labeled Telegram bot that serves as the consumer frontend for the deployed contract — without any additional developer configuration.

The Portal Bot is not a template applied after the fact. It is generated synchronously with the contract throughout the development process, because in Temix, the bot interface and the contract logic are defined as a unified artifact from the first line of code.

4. The JSON UI Schema (JUS): The Synchronization Standard

The mechanism that keeps the Portal Bot in continuous sync with the underlying contract is the JSON UI Schema (JUS) — a deterministic mapping standard that constitutes the formal interface between Tact contract logic and Telegram Bot API components.

JUS is a constrained subset of the Telegram Bot API specification, specifically mapping InlineKeyboardMarkup and CallbackQuery fields to Tact message opcodes. It is not a general-purpose schema. It is purpose-built for the specific translation problem Temix solves: given a Tact receive handler, generate a verified, type-safe Telegram UI element that correctly invokes it.

Every JUS entry defines four things:

The UI Component: The Telegram Bot API element (button label, callback data, keyboard layout).

The Opcode Binding: The specific Tact message opcode the component triggers.

The Message Body: The serialized cell structure passed as the message payload.

The Constraint Declaration: The validation rules applied to the binding at commit time.

JUS: TACT-TO-TELEGRAM MAPPING MODEL ───────────────────────────────────────────────────────────────── TACT CONTRACT SIDE JUS ENTRY TELEGRAM BOT SIDE ───────────────── ───────── ───────────────── receive(msg: Transfer) { { [ Transfer Button ] // handler logic ←── "ui": { ←─ callback: "txfr_01" } "label": "Transfer", "callback": "txfr_01" op::transfer = 0x178d4519; ←── "opcode": "0x178d4519", "body": { msg.amount: Int as coins; ←── "amount": "coins", msg.to: Address; ←── "to": "Address" }, "constraints": [ // max 1023 bits ←── "serialization_limit", // bounced handler req. ←── "bounce_coverage" ] } } STATUS: All constraints PASS → Committed to Event Log as atomic unit 

When a developer instructs Temix to "Add a Transfer button," the Hybrid AI Engine generates a candidate JUS entry. If the entry is valid — meaning it passes all deterministic constraint checks — it is committed to the event log simultaneously with the corresponding Tact code. The contract and the interface are versioned together, as a single artifact. They cannot diverge.

4.1 Resolution Failure Mode: Stage 2-B

When the AI Engine cannot generate a valid JUS-to-Tact mapping — because of mismatched data types, complex cell serialization requirements, or ambiguous intent — the pipeline does not proceed silently. It enters Stage 2-B: Resolution Audit.

The system surfaces a Partial Resolution Issue Card presenting the developer with the specific mapping gap that could not be resolved automatically. The developer provides the explicit mapping. The pipeline is blocked until the mapping clears the Constraint Layer. This is a hard stop, not a warning. Partial mappings do not enter the event log.

5. The Six-Stage Deterministic Pipeline

Every command submitted to Temix — regardless of its origin in chat or Mini App — is processed through the same six-stage pipeline before any state change is committed.

THE SIX-STAGE DETERMINISTIC PIPELINE ───────────────────────────────────────────────────────────────── Developer Input (Chat or Mini App) │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 1 — SUBMISSION │ │ Timestamped. Ingested. Queued for resolution. │ └───────────────────────────┬───────────────────────────────────┘ │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 2 — RESOLUTION (only non-deterministic step)│ │ Hybrid AI Engine generates: Tact code delta + JUS entry │ │ │ │ Resolution success? ──YES──────────────────────────────────► │ │ Resolution failure? ──NO──► STAGE 2-B: Resolution Audit │ │ Developer supplies manual mapping │ └───────────────────────────┬───────────────────────────────────┘ │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 3 — VALIDATION (Semantic Constraints Engine) │ │ │ │ Deterministic checks ── FAIL ──► HARD BLOCK. No commit. │ │ Deterministic checks ── PASS ──► │ │ AI-assisted checks ──── WARN ──► Issue Card surfaced │ └───────────────────────────┬───────────────────────────────────┘ │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 4 — COMMIT │ │ Atomic event appended to hash-linked log. │ │ Tact change + JUS change linked as single versioned record. │ └───────────────────────────┬───────────────────────────────────┘ │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 5 — MATERIALIZATION │ │ Backend file tree updated. Mini App view refreshed. │ │ Portal Preview updated. │ └───────────────────────────┬───────────────────────────────────┘ │ v ┌───────────────────────────────────────────────────────────────┐ │ STAGE 6 — EXPOSURE │ │ Portal Bot interface updated dynamically, OR │ │ New Portal Manifest generated for export/deployment. │ └───────────────────────────────────────────────────────────────┘ 

Stage 1 — Submission: Intent is expressed in the Command Interface. The system timestamps and ingests the raw input.

Stage 2 — Resolution: The Hybrid AI Engine processes the intent, generating both a Tact code delta and a JUS entry. This is the only stage where non-deterministic logic is applied. If resolution fails, the pipeline branches to Stage 2-B.

Stage 3 — Validation: The Semantic Constraints Engine applies all registered invariants to the resolution output. Deterministic checks must pass. AI-assisted checks produce warnings.

Stage 4 — Commit: A new event is appended to the immutable hash-linked log. The event links the UI change to the code change, producing a single, atomic, versioned record.

Stage 5 — Materialization: The backend updates the canonical file tree. The Mini App refreshes its view. The Portal Preview updates to reflect the new interface state.

Stage 6 — Exposure: The Portal Bot's live interface is updated dynamically, or a new build manifest is generated for export if the project is in a deployment-ready state.

No stage can be skipped. No commit can occur that does not have a complete chain from Submission through Validation.

6. The Semantic Constraints Engine: Hybrid Validation

The Semantic Constraints Engine is the protocol's enforcement layer. It is a stateless linter that executes between Resolution and Commit. Its authority is absolute: a commit that does not satisfy its deterministic invariants does not happen.

The Engine operates in two distinct modes, with explicitly different authority levels.

6.1 Deterministic Invariants (Hard Block)

These checks are implemented programmatically and produce binary pass/fail results:

Opcode Uniqueness: No two JUS entries may bind to the same Tact opcode. Collision is rejected at the constraint layer before it can produce a duplicate handler in the contract.

Serialization Limits: The message body defined in any JUS entry is validated against the TVM's 1023-bit cell limit. A message body that would overflow the cell is rejected, not warned about.

Type Consistency: The data type declared in the JUS message body must match the type expected by the corresponding Tact receiver. Type mismatches are a hard block.

6.2 AI-Assisted Guardrails (High-Risk Warning)

These checks apply heuristic reasoning to the resolved output and produce warnings, not blocks — unless the developer has enabled Safety Mode, in which case they escalate to hard blocks:

Gas-Safety Heuristics: Estimation of whether a message chain will exceed standard gas limits, based on prior sandbox traces and known TON gas pricing schedules.

Bounce Logic Coverage: Detection of outgoing messages that lack a corresponding bounced handler in the contract, flagging potential message loss.

Reentrancy Patterns: Identification of message sequences that resemble known reentrancy risk patterns in TON's actor model.

The policy is explicit: AI-assisted checks inform. Deterministic checks enforce. Professional developers can distinguish between the two at a glance.

SEMANTIC CONSTRAINTS ENGINE: AUTHORITY MODEL ───────────────────────────────────────────────────────────────── Resolved Output (Tact delta + JUS entry) │ ├──────────────────────────────────────────┐ │ │ v v ┌────────────────────────┐ ┌─────────────────────────┐ │ DETERMINISTIC LAYER │ │ AI-ASSISTED LAYER │ │ (Programmatic) │ │ (Heuristic) │ │ │ │ │ │ • Opcode uniqueness │ │ • Gas-safety estimate │ │ • Cell size ≤1023 bit │ │ • Bounce logic gaps │ │ • Type consistency │ │ • Reentrancy patterns │ └───────────┬────────────┘ └──────────┬──────────────┘ │ │ PASS │ FAIL WARN │ (Safety Mode: BLOCK) │ │ │ │ v v │ ██ HARD BLOCK ██ ⚠ Issue Card surfaced │ Pipeline stops. Dev may proceed. │ No commit occurs. │ v Proceed to Stage 4 (Commit) 

7. Temporal Execution and Sandbox Fidelity

TON's asynchronous actor model means that the meaningful unit of debugging is not a function call — it is a message cascade unfolding across time. Static stack traces are insufficient. Temix provides the Temporal Timeline Layer: a scrubbing interface in the Mini App that renders every message sent and received during a sandbox execution as a discrete, ordered step on a timeline.

7.1 Foundation and Fidelity Ceiling

Temix's emulation layer is built on the industry-standard @ton/sandbox (Blueprint's sandbox environment). It does not claim custom VM engineering. This foundation is explicitly documented along with its known fidelity limits:

Network Jitter: The sandbox assumes zero millisecond latency between internal messages. Mainnet does not. Timing-sensitive contract logic that passes sandbox validation may exhibit different behavior under real network conditions.

Sharding Semantics: The sandbox executes in a single-threaded context. It does not replicate cross-shard routing delays or the non-deterministic message ordering that cross-shard communication can produce on mainnet.

7.2 Mainnet Simulation Mode

To pressure-test contracts against the conditions the sandbox cannot replicate natively, the Temporal Timeline Layer includes a Mainnet Simulation Mode. When enabled, the system injects:

Artificial 2-5 second latency intervals between internal message steps.

Randomized message delivery ordering within concurrent message groups.

This does not make the sandbox a faithful mainnet replica. It makes race conditions and timing dependencies visible before deployment, which is the actual developer need. The distinction is made explicit in the interface. Developers who pass Mainnet Simulation Mode have tested their assumptions. Developers who have not are warned.

TEMPORAL TIMELINE LAYER: MESSAGE CASCADE VIEW ───────────────────────────────────────────────────────────────── SANDBOX MODE MAINNET SIMULATION MODE ──────────── ─────────────────────── t=0ms [Portal Bot]──► ContractA t=0s [Portal Bot]──► ContractA (send: Transfer) (send: Transfer) t=0ms ContractA ──────► ContractB t=2.3s ContractA ──────► ContractB (internal msg) (injected jitter) t=0ms ContractB ──────► ContractA t=4.1s ContractB ──────► ContractA (response) (randomized order) t=0ms ContractA ──────► [Wallet] t=4.1s ContractB ──────► ContractC (completion) (out-of-order arrival) t=6.8s ContractA ──────► [Wallet] ◄──── scrub timeline ────────────► ⚠ Race condition detected at t=4.1s Gas consumed: visible per step Stale carry value in ContractA 

8. Conflict Resolution and the Human Authority Principle

In any system where AI generates code and humans can also edit it directly, conflict is not an edge case. It is a design requirement.

Temix resolves this with a clear hierarchy: human intent is always the final authority.

When a conflict occurs between a chat-originated command and a manual Mini App edit — both of which have been submitted as commands to the event log — the system does not attempt automatic resolution. It presents a three-way diff: the AI-generated version, the manually-edited version, and the last committed common ancestor. The Hybrid AI Engine provides a plain-language explanation of the implications of each version. The developer provides an explicit Commit Signal. No merge occurs without it.

Manual edits made within the Mini App take precedence over AI suggestions by default. This is not a UI convention — it is encoded in the event log's conflict resolution policy.

The result is an event log that is a complete, unambiguous record of every state transition, every conflict, and every resolution decision. It is not a chat history with some commits in it. It is a commit history that happens to have been produced through conversation.

CONFLICT RESOLUTION: THREE-WAY DIFF MODEL ───────────────────────────────────────────────────────────────── [ LAST COMMITTED ANCESTOR ] hash: 0x4a3f...c2d1 │ ┌────────────┴────────────┐ │ │ v v [ CHAT COMMAND OUTPUT ] [ MINI APP MANUAL EDIT ] AI-generated version Human-edited version gas_limit: 50000000 gas_limit: 30000000 bounce: auto bounce: explicit handler │ │ └────────────┬────────────┘ │ v ┌───────────────────────┐ │ AI MERGE ASSISTANT │ │ │ │ "The AI version uses │ │ auto-bounce which │ │ risks message loss. │ │ The manual version │ │ is safer but costs │ │ more gas." │ └───────────┬───────────┘ │ v Developer provides explicit ── COMMIT SIGNAL ──────────► Event appended to log Manual-Override-First policy Human version wins by default 

9. Monetization: Capturing Value at the Moment of Realization

Temix's monetization model is designed around a single insight: the moment of highest developer commitment is not the beginning of a project. It is the moment a project crosses from experimentation into production.

9.1 The Thinking Phase — Free

All pre-deployment activity is free, without restriction:

Architectural brainstorming and natural language exploration.

Tact contract authoring and JUS schema definition.

Sandbox emulation and Temporal Timeline tracing.

Portal Bot preview and UI iteration.

Unlimited testnet deployments.

The thinking phase is where Temix earns developer trust. Charging for it would penalize the behavior — exploration and iteration — that produces the high-quality contracts that make the mainnet deployment valuable.

MONETIZATION: VALUE CAPTURE AT THE MOMENT OF REALIZATION ───────────────────────────────────────────────────────────────── ══════════════════════════════════╦══════════════════════════════ THINKING PHASE ║ SPRINT PHASE (Free) ║ (Stars) ══════════════════════════════════╬══════════════════════════════ ║ ✓ Natural language brainstorm ║ ★ Mainnet contract deploy ✓ Tact authoring + JUS design ║ ★ Portal Bot instantiation ✓ Sandbox emulation ║ ★ Managed hosting (webhook, ✓ Temporal Timeline tracing ║ uptime, state persistence) ✓ Portal Bot preview ║ ✓ Unlimited testnet deploys ║ Stars → Rollover Credits ✓ Conflict resolution ║ Credits do NOT expire at midnight ✓ Git export at any time ║ Credits carry forward indefinitely ║ ──────────────────────────────────╬────────────────────────────── Developer builds trust here. ║ Temix captures value here. ══════════════════════════════════╩══════════════════════════════ 

9.2 The Sprint Phase — Stars-Based Rollover Credits

Mainnet deployment and managed Portal Bot hosting require Telegram Stars. Stars are converted to Rollover Credits within the Temix system. Credits do not expire at midnight. They accumulate and carry forward, reflecting the reality that developer sprints are not 24-hour windows — they are irregular, intense, and separated by longer periods of asynchronous thinking.

Credits cover two operational costs:

Mainnet Deployment Gas: The Stars cost of submitting a contract deployment transaction to the TON mainnet.

Managed Portal Bot Hosting: The operational cost of running the deployed Portal Bot on Temix-managed infrastructure.

9.3 The Managed Node Model

When a developer deploys a Portal Bot through Temix, they have two options.

Self-Hosted (Free): Export the full Git repository — containing the compiled Tact contracts, the JUS schema, and the Portal Bot source — and host the bot on any infrastructure that supports the Telegram Bot API. No ongoing cost. No dependency on Temix after export.

Managed (Stars): Temix operates the Portal Bot on its own serverless infrastructure. This covers webhook registration and management, API rate-limit handling, bot state persistence, and 24/7 uptime guarantees. The Stars-based fee is a Platform-as-a-Service charge for operational convenience, not a toll on access to the developer's own work.

The self-hosted path is always available. The managed path is always paid. This is the Minimality Principle in practice.

10. Portability: The Git Exit and the Minimality Principle

Temix is a development environment, not a platform with a moat built from lock-in. The protocol adheres to a strict Minimality Principle: the system is a facilitator. The developer owns the output.

At any point in a project's lifecycle, a developer can export:

The complete hash-linked Event Log, structured as a standard Git commit history.

The full Tact Source, compatible with Blueprint and any standard TON development toolchain.

The complete Portal Manifest, containing the JUS schema and the Portal Bot source code, deployable on any Telegram Bot API-compatible server.

The Git export is not a backup format. It is a first-class output. A project exported from Temix is immediately manageable by any developer using Blueprint, forkable on GitHub, and auditable by any security researcher who has never used Temix. The protocol's value is in the speed and coherence it provides during development — not in retaining custody of the output.

This principle is also a credibility claim: if Temix stopped operating tomorrow, every project built on it would continue to exist, be deployable, and be maintainable by its developer. No work is lost. No contracts are stranded. This is what it means to own the protocol.

THE GIT EXIT: ZERO LOCK-IN EXPORT MODEL ───────────────────────────────────────────────────────────────── [ TEMIX PROJECT ] │ Export at any time │ ┌────────────────┼─────────────────┐ │ │ │ v v v [ EVENT LOG ] [ TACT SOURCE ] [ PORTAL MANIFEST ] Structured as Compatible with JUS schema + standard Git Blueprint CLI Bot API source commit history and any TON runnable on any toolchain standard server │ │ │ v v v GitHub / self blueprint run node bot.js hosted repo deploy (no Temix needed) ───────────────────────────────────────────────────────────────── Temix is a development accelerator. The output belongs to you. 

11. Competitive Positioning

Temix operates in a space currently defined by general-purpose tools applied to a specific-purpose problem. Its competitive landscape falls into two categories: legacy TON tooling that predates the mobile-native paradigm, and AI-native coding environments that are platform-agnostic but structurally incapable of closing the contract-to-interface gap.

11.1 Legacy TON Tooling

Blueprint is the official TON development framework. It is well-maintained, CLI-first, and desktop-bound. It solves the compilation and deployment problem. It does not address the interface generation problem, the mobile development problem, or the async debugging problem. Temix wraps Blueprint's sandbox and extends it; it does not replace Blueprint's community or toolchain position. Blueprint is infrastructure Temix builds on, not a competitor it displaces.

TON IDE plugins (VS Code extensions, JetBrains plugins) bring compiler integration to existing desktop environments. They remain desktop-bound and produce no Portal output. They represent an iterative improvement to the fragmented workflow Temix replaces, not an alternative to it.

Custom bot development requires a separate toolchain, separate deployment, and manual synchronization with the contract. The interface disconnection problem is structurally unsolved by this approach, regardless of the tooling quality applied to either half.

11.2 AI-Native Coding Environments

The more significant competitive question is not whether a TON-specific tool can be improved, but whether a well-funded, general-purpose AI coding environment — Cursor, GitHub Copilot, or a successor — could add Telegram support and compete directly with Temix's core value proposition.

The answer reveals why Temix's moat is architectural rather than feature-based.

A general-purpose AI coding assistant operates on files. It generates code, suggests completions, and applies patches. It has no concept of a unified artifact — no formal relationship between a contract interface and the bot UI that surfaces it. Adding "Telegram support" to such a tool means generating bot boilerplate alongside contract code, not generating them as a single versioned, constraint-validated, atomic record. The interface disconnection problem survives this addition entirely.

Temix's JUS standard is the structural element a general-purpose tool cannot replicate without adopting the same design commitment. JUS is not a feature — it is a formal synchronization standard. It defines, at the schema level, the invariant that the contract and its interface are always at the same commit. A tool that does not enforce this at the validation layer, before commit, does not provide this guarantee regardless of how sophisticated its code generation is.

A general-purpose AI tool is also fundamentally desktop-oriented and file-system-centric. Temix's Headless IDE paradigm — where the development environment lives inside Telegram, runs on a mobile device, and surfaces state through a Mini App — is not a skin over a desktop tool. It is a different conceptual model, and the developer workflow it enables (authoring contracts in a Telegram chat, reviewing state in a Mini App, deploying from a phone) is not replicable by adapting an existing desktop tool.

11.3 The Moat

Temix's moat is not a feature. It is a paradigm: the unification of contract and interface as a single deterministic artifact, delivered through a mobile-native development environment that lives inside the platform its output runs on. This is not a workflow improvement. It is a different model of what a TON development environment should be.

The moat holds as long as two conditions are true: Temix provides a development experience on mobile that is genuinely superior to opening a terminal on a desktop, and no competing tool enforces the JUS synchronization invariant or an equivalent formal contract-to-interface binding. Every design decision in the protocol is evaluated against both benchmarks.

12. Roadmap

The Temix Protocol is specified at v1.0. The following milestones define the build and release sequence.

12.1 Phase 1 — Protocol Core (MVP)

The MVP delivers the complete six-stage pipeline, the event log, the JUS standard, the Telegram Command Interface, and the Mini App dashboard — end to end — against the TON testnet. Mainnet deployment is gated behind Phase 2. Every component described in this white paper is present in MVP form, including the Git export and the Portal Bot generator. The MVP is defined as: a developer can build a Tact contract, author a JUS schema, run it in sandbox, review the Temporal Timeline, preview the Portal Bot, and export a Git bundle — all from a Telegram chat.

12.2 Phase 2 — Mainnet and Managed Hosting

Phase 2 activates the Stars monetization layer: mainnet deployment, Portal Bot instantiation, and the managed hosting runtime. The Rollover Credits system is activated. This phase is entered only when the testnet pipeline has been validated against real developer workflows.

12.3 Phase 3 — Protocol Expansion

Phase 3 opens the protocol surface to the broader TON ecosystem. Target capabilities include: multi-file project support at full fidelity, multi-contract project graphs (cross-contract message routing surfaced in the Temporal Timeline), JUS schema extensions for richer Telegram UI components (inline queries, Web App deep links), and a public Constraint Registry allowing the community to author and publish additional deterministic invariants against the constraints engine.

12.4 Phase 4 — Network Layer

Phase 4 introduces the network dimension of the Temix protocol: a discoverable registry of deployed Portal Bots, allowing TON users to find and interact with contracts directly through Telegram search. The registry is opt-in, curated by JUS schema quality, and indexed by contract type. This is the "Own the Network" clause of the protocol tagline — the point at which the aggregate of all deployed Portals constitutes a navigable application layer on top of TON, accessible without a browser, terminal, or wallet configuration.

---

13. Team

The Temix Protocol is authored and being built by [TEAM SECTION — to be populated before external release. Include: founder backgrounds, relevant TON/Telegram/blockchain development experience, any prior protocol or developer tooling shipped, and advisory relationships if applicable. This section is intentionally left as a placeholder in the technical specification draft. A white paper released to external audiences without credentialing its authors leaves the adoption decision unmade. Fill this before distribution.].

---

14. Conclusion: The Unified Stack

The Temix Protocol is the answer to a specific question that the TON ecosystem has not yet formally asked: what does a development environment look like when it is designed for the network it serves, rather than adapted from tooling designed for a different network entirely?

TON is asynchronous. Its debugging model must be temporal, not linear. TON's distribution is Telegram. Its development environment should be Telegram-native. TON's applications are bots and contracts operating as unified user experiences. Its toolchain should produce them as unified artifacts.

Temix is the environment that makes these requirements the starting point, not the afterthought.

By enforcing a deterministic separation between developer intent and system state, by linking contract logic and bot interface through a formal schema standard, by making the sandbox's limits explicit rather than hiding them, and by providing a clean exit to standard tooling at every stage, Temix offers the TON ecosystem something that has not existed before: a development stack whose architecture respects the architecture of the network it builds for.

The protocol is specified. The pipeline is defined. The validation is live.

Build the Protocol. Export the Portal. Own the Network.

Temix Protocol White Paper — Version 1.0
This document describes the Temix Protocol architecture as of the v1.0 specification. Technical details are subject to revision as the protocol evolves.
