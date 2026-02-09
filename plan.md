# UI Studio (React) — Revised Agent Reference Plan

> **Goal**
> Build a **React-only, in-browser no-code studio** that designs, previews, and exports
> **production-ready React applications and components** with **configurable test coverage**,
> using **IndexedDB** for persistence and **spec-driven generation** as the source of truth.
>
> Angular support will be added later as a **separate app** or by promoting this repo to a monorepo.

---

## 0. Locked Decisions (MVP)

These decisions are final for the initial implementation.

- Framework: **React 18**
- Build tool: **Vite**
- Language: **TypeScript only**
- Components: **Functional components only**
- Tests: **Vitest + React Testing Library**
- Styling: **Plain CSS / inline styles only**
- Preview: **Spec-driven renderer (no runtime TSX execution)**
- Storage: **IndexedDB**
- Persistence model: **Single JSON per instance**
- Concurrency: **Per-instance locking** (multiple instances can be open, but each instance can only be edited by one tab at a time)

---

## 1. Repository Strategy

### Decision
- Start as a **single-app repository** named `ui-studio`.
- Internally separate concerns so the repo can be promoted to a monorepo later.

### Folder Layout (Monorepo-Ready)
```
ui-studio/
  src/
    app/              # React Studio UI (pages, routes, panels)
    core/             # schema, validation, graph, IndexedDB, locks, migrations
    generator/        # React export generator (fileTree)
    preview/          # spec-driven preview runtime
    llm/              # LLM abstraction + TOON encoding (phase 2)
    utils/            # shared helpers
  templates/          # static templates/fragments for exported app
  docs/
  plan.md
  revised_plan.md
  package.json
```

---

## 2. Exported React App (What We Generate)

### Output Stack
- Vite + React + TypeScript
- Vitest + React Testing Library
- ESLint + Prettier

### Generated Structure
```
generated-app/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  src/
    main.tsx
    app/
      App.tsx
      app.spec.tsx
    contexts/                    # NEW: Context API providers
      <Context>Context.tsx
      index.ts
    features/
      <feature>/
        index.ts
        <feature>.spec.tsx
        components/
          <Component>.tsx
          <Component>.spec.tsx
    components/
      <SharedComponent>.tsx
      <SharedComponent>.spec.tsx
      index.ts
    services/
      <service>.ts
      <service>.spec.ts
      index.ts
```

### Guarantees
- Every component has a test (configurable: smoke/full/opt-out)
- Every folder/feature can have a test
- Application-level spec test always exists
- Generated project runs with:
  - `npm install`
  - `npm test`
  - `npm run dev`

---

## 3. Persistence Model (Single JSON per Instance)

### Core Rules
- One **JSON document** represents the entire project
- Stored in **IndexedDB**
- Schema versioned (`schemaVersion`)
- Deterministic generation from JSON

### Instance Contains
- App settings (router, styling, tests)
- Graph/tree of folders, components, services
- Specs (markdown + structured JSON)
- Mock data for preview/tests
- Contexts (shared state definitions)
- Optional LLM context
- Optional cached build output

### 3.3 Migration Strategy (MVP)

**Problem:** Schema will evolve over time. Existing instances in IndexedDB must be migrated.

**Solution:**
1. Each instance has `schemaVersion: number` (starting at 1)
2. Migration registry: `migrations: Record<number, MigrationFn>`
3. On instance load, apply migrations sequentially from `instanceVersion + 1` to `CURRENT_VERSION`
4. Each migration is a pure function: `(instanceV_n) => instanceV_n+1`

**Example:**
```ts
// core/migrations.ts
export const CURRENT_SCHEMA_VERSION = 2;

export const migrations = {
  2: (instance: InstanceV1): InstanceV2 => {
    // Add contexts field to AppSpecJSON
    return {
      ...instance,
      schemaVersion: 2,
      appSpec: { ...instance.appSpec, contexts: [] },
    };
  },
};

// core/instanceLoader.ts
export function migrateInstance(instance: any): InstanceJSON {
  let current = instance;
  for (let v = instance.schemaVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
    }
  }
  return current;
}
```

**Impact:**
- Instances never break across schema updates
- Users don't lose data
- Migrations are testable and reversible (if needed)

---

## 4. Concurrency & Locking

### IndexedDB Stores
- `instances` → full project JSON
- `locks` → array of `{ instanceId, tabId, ts }`
- `secrets` → encrypted API keys (phase 2)

### Lock Rules (Per-Instance)
- Each **instance** can only be edited by **one tab at a time**
- Multiple instances can be open across different tabs simultaneously
- Use `BroadcastChannel` to sync lock state across tabs
- Show error if another tab holds the lock for the same instance
- Release lock on tab close/unload
- Stale lock cleanup: locks older than 5 minutes are auto-released

**Example Flow:**
- User opens Instance A in Tab 1 → Lock acquired: `{ instanceId: "A", tabId: "tab1", ts: 123 }`
- User opens Instance B in Tab 2 → Lock acquired: `{ instanceId: "B", tabId: "tab2", ts: 124 }` ✅
- User opens Instance A in Tab 3 → Error: "Instance A is already open in another tab"

**Lock Structure:**
```ts
interface LockRecord {
  instanceId: string;  // Which instance is locked
  tabId: string;       // Which tab holds the lock
  ts: number;          // Timestamp for stale lock cleanup
}
```

**BroadcastChannel Messages:**
```ts
type LockMessage =
  | { type: "lock_acquired"; instanceId: string; tabId: string }
  | { type: "lock_released"; instanceId: string; tabId: string }
  | { type: "lock_ping"; instanceId: string; tabId: string };
```

---

## 5. Preview Strategy (MVP)

### Spec-Driven Preview (Required)
- Preview does **not** execute generated TSX
- Renders from structured `ComponentSpecJSON`
- Uses a small, controlled set of primitives

### Supported Preview Primitives
- Stack (row / column)
- Card
- Heading
- Text
- Button
- Input
- Select
- Table
- Alert

### Mock Data
- Component props come from `componentMocks`
- Service calls use `serviceMocks`
- Context values use `contextMocks`

### 5.4 Error Boundaries (MVP)

**Problem:** Preview may crash due to invalid specs or rendering errors.

**Solution:**
1. Wrap preview in React Error Boundary
2. Show fallback UI with error message
3. Allow user to reset preview or fix spec
4. Log errors to console (no external service)

**Error Categories:**
- **Validation errors** → Block export, show inline in builder
- **Preview runtime errors** → Caught by error boundary, show fallback
- **Storage errors** → Show toast/modal, suggest refresh
- **Generation errors** → Block export, show error details

**Generated Code:**
```tsx
// Optionally generate error boundary in exported app
interface AppSpecJSON {
  errorBoundary?: {
    enabled: boolean;
    fallbackUI?: UIBlock[];  // Custom fallback
  };
}
```

---

## 6. Generator Architecture

### Contract
```ts
generateFileTree(instance: InstanceJSON) -> Record<string, string>
```

### Responsibilities
- Validate instance (block export if invalid)
- Generate deterministic file tree
- Create all config, components, services, tests, contexts
- Run Prettier formatting
- Export ZIP

### Generated Files Include
- All component files + tests
- All service files + tests
- Context providers (if defined)
- Barrel exports (`index.ts`)
- Config files (Vite, TypeScript, Vitest)
- Package.json with dependencies

---

## 7. Spec System (Source of Truth)

Each spec exists as:
- Markdown (human-readable)
- Structured JSON (machine-readable, storage format)

### Spec Hierarchy
1. Application spec
2. Folder/feature specs
3. Component specs
4. Service specs
5. Test specs

This same hierarchy is reused for:
- Code generation
- Preview rendering
- LLM context building (converted to TOON format in Phase 2)

---

## 8. Minimal Spec Schemas (MVP)

### AppSpecJSON
```ts
interface AppSpecJSON {
  name: string;
  layout: "single-page" | "routed";
  routing?: {
    enabled: boolean;
    type: "hash" | "browser";
  };
  contexts?: ContextSpec[];  // NEW: Shared state
  errorBoundary?: {          // NEW: Error handling
    enabled: boolean;
    fallbackUI?: UIBlock[];
  };
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  testStrategy: "all" | "entry-points-only";  // NEW: Test generation strategy
}
```

### ContextSpec (NEW - MVP)
```ts
interface ContextSpec {
  id: string;
  name: string;              // e.g., "AuthContext"
  description?: string;
  shape: Record<string, TypeDef>;  // { user: { type: "User | null" } }
  defaultValue: any;
  mockValue?: any;           // For preview
}

interface TypeDef {
  type: string;              // TypeScript type as string
  optional?: boolean;
}
```

**Generated Context Example:**
```tsx
// src/contexts/AuthContext.tsx
import { createContext } from "react";

export interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});
```

### FolderSpecJSON
```ts
interface FolderSpecJSON {
  id: string;
  name: string;
  description?: string;
  barrelExport: boolean;       // Generate index.ts
  hasTest?: boolean;           // Generate folder-level test
}
```

### ComponentSpecJSON
```ts
interface ComponentSpecJSON {
  id: string;
  name: string;
  props: PropDef[];
  events?: EventDef[];
  localState?: StateDef[];
  consumesContexts?: string[];  // NEW: IDs of contexts this component uses
  ui: UIBlock[];
  dataSource?: {
    type: "service" | "prop" | "context";
    source: string;
  };
  testLevel?: "none" | "smoke" | "full";  // NEW: Configurable test coverage
}

interface PropDef {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}

interface EventDef {
  name: string;            // e.g., "onClick"
  handler: string;         // Function name
  params?: string[];
}

interface StateDef {
  name: string;
  type: string;
  initialValue: any;
}
```

**Test Level Behavior:**
- `"none"` → No test file generated
- `"smoke"` (default) → Basic render test only
- `"full"` → Render + interaction + edge cases

### ServiceSpecJSON
```ts
interface ServiceSpecJSON {
  id: string;
  name: string;
  methods: MethodDef[];
  http?: {
    baseUrl: string;
    headers?: Record<string, string>;
  };
}

interface MethodDef {
  name: string;
  params: ParamDef[];
  returnType: string;
  async: boolean;
  http?: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
  };
}
```

### TestSpecJSON
```ts
interface TestSpecJSON {
  level: "smoke" | "basic" | "comprehensive";
  include?: string[];      // Component/service IDs to test
  exclude?: string[];      // Skip these IDs
}
```

---

## 9. UIBlock DSL (Preview + Codegen)

UI is defined using a structured DSL.

Supported blocks:
- Stack (row / column)
- Card
- Heading
- Text
- Button
- Input
- Select
- Table
- Alert

**Example:**
```json
{
  "type": "Stack",
  "direction": "column",
  "spacing": 2,
  "children": [
    { "type": "Heading", "level": 1, "text": "Welcome" },
    { "type": "Text", "content": "{user.name}" },
    { "type": "Button", "label": "Logout", "onClick": "handleLogout" }
  ]
}
```

Rules:
- UI is rendered recursively
- State bindings (e.g., `{user.name}`) must exist in props/state/context
- Invalid bindings are validation errors

---

## 10. Test Generation Rules

### Component Tests
- **Default: Smoke test** (basic render)
- **If `testLevel: "full"`**: Add interaction tests for events
- **If `testLevel: "none"`**: Skip test file

### Folder Tests
- Generated only if `hasTest: true`
- Smoke-render entry component

### App Tests
- App bootstrap test (always)
- Route smoke tests (if routing enabled)

**Example Generated Test:**
```tsx
// src/components/UserProfile.spec.tsx
import { render, screen } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  it("renders without crashing", () => {
    render(<UserProfile user={null} />);
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });
});
```

---

## 11. Validation Rules (Strict)

### Naming Conventions
- Component names: **PascalCase** (e.g., `UserProfile`)
- Folder names: **kebab-case** (e.g., `user-management`)
- Service files: **camelCase** (e.g., `authService`)
- Context names: **PascalCase** + `Context` suffix (e.g., `AuthContext`)

### Structural Rules
- Graph must be a valid tree (no cycles)
- All referenced IDs must exist
- Router requires both:
  - `settings.router === true`
  - `appSpec.routing.enabled === true`
- Context references: `consumesContexts` must reference valid context IDs
- State bindings: All `{variable}` references must exist in props/state/context

### Performance Limits (NEW - MVP)
- Max components per instance: **500**
- Max tree depth: **10 levels**
- Max spec size: **5MB JSON**
- Max context count: **20**

### Error Handling
Validation errors **must block export**. Show inline errors in builder UI.

**Error Types:**
- `VALIDATION_ERROR` → Invalid schema, missing refs, naming violations
- `PREVIEW_RUNTIME_ERROR` → Caught by error boundary
- `STORAGE_ERROR` → IndexedDB failure (show retry option)
- `GENERATION_ERROR` → Template rendering failed (show error details)

---

## 12. LLM Integration (Phase 2)

### Design
- Pluggable providers (OpenAI, Anthropic, etc.)
- Encrypted API key storage in `secrets` IndexedDB store
- Provider switching without losing context

### Context Builder with TOON Format

**Why TOON for LLM Communication?**
- **40% fewer tokens** compared to JSON (significant cost savings)
- **Better parsing accuracy** for LLMs (73.9% vs 70% for JSON)
- **More readable** for debugging LLM interactions

**Implementation:**
```typescript
// src/llm/contextBuilder.ts
import { encode } from '@toon-format/toon';

export function buildLLMContext(instance: InstanceJSON): string {
  // Convert JSON specs to TOON format for LLM
  const context = {
    appSpec: instance.appSpec,
    folders: instance.folders,
    components: instance.components,
    services: instance.services,
    contexts: instance.contexts,
  };

  return encode(context);  // JSON → TOON (40% smaller)
}
```

**Context Building Process:**
1. Extract relevant specs from IndexedDB (JSON objects)
2. Convert to TOON format using `@toon-format/toon`
3. Send compact TOON string to LLM
4. Receive response (can be JSON or TOON)
5. Parse and validate response
6. Store back as JSON in IndexedDB

**Dependencies (Phase 2):**
```json
{
  "dependencies": {
    "@toon-format/toon": "^2.1.0"  // Only installed in Phase 2
  }
}
```

**Key Principle:**
- **Storage format**: JSON (IndexedDB, memory)
- **LLM communication format**: TOON (40% token savings)
- **Export format**: JSON (standard, universal compatibility)

LLM is **assistive**, never the source of truth.

---

## 13. Implementation Milestones

### Milestone 1 — Core & Persistence
- Schema + validators
- IndexedDB adapter
- Lock manager (per-instance)
- Migration framework
- Instance home screen

### Milestone 2 — Builder
- Tree editor (virtualized for performance)
- Spec editors (app, component, service, context)
- Mock data editor
- Validation feedback UI

### Milestone 3 — Preview
- Spec-driven renderer
- Component preview
- App shell preview
- Error boundaries

### Milestone 4 — Generator & Export
- FileTree generator
- Templates (including contexts)
- Prettier pass
- ZIP export

### Milestone 5 — LLM (Optional)
- Provider abstraction (OpenAI, Anthropic, etc.)
- TOON encoder integration (`@toon-format/toon`)
- Context builder (JSON → TOON conversion)
- Spec generation assistance
- LLM response parser and validator

---

## 14. Definition of Done (MVP)

- Per-instance locking works (multiple instances, one editor per instance)
- Specs fully define components, services, and contexts
- Preview renders from specs with error boundaries
- Exported ZIP builds and tests successfully
- Deterministic output from same JSON input
- Schema migrations work for version updates
- Performance limits enforced (500 components, 10 levels)

---

## 15. Non-Goals (MVP)

- No runtime execution of generated TSX
- No Angular support yet
- No backend
- No visual drag-and-drop editor (form + tree only)
- No undo/redo (post-MVP)
- No re-import of exported apps (post-MVP)
- No cloud export targets (GitHub, StackBlitz) (post-MVP)
- No custom preview elements (post-MVP)

---

## 16. Long-Term Vision

- Add Angular Studio as a separate app
- Promote repo to monorepo
- Shared `core`, `spec`, and `llm` packages
- Optional SaaS layer on top of OSS core

---

## 17. Performance Guidelines (MVP)

### Builder Performance
- **Tree editor**: Use `react-window` for virtualization (handles 1000+ nodes)
- **Preview updates**: Debounce spec changes (500ms)
- **Component previews**: Lazy-load off-screen components
- **IndexedDB queries**: Index on `instanceId` and `ts` for fast lookups

### Limits (Enforced by Validation)
- Max components: 500
- Max tree depth: 10 levels
- Max spec JSON size: 5MB
- Max context count: 20
- Max service methods per service: 50

### Performance Monitoring
- Log validation time in console
- Show warning if tree depth > 8
- Show warning if component count > 400

---

## 18. Custom Preview Elements — Sandboxed (Post-MVP)

### Problem
- 9 primitives may feel restrictive for advanced UIs
- Users may want custom charts, maps, or third-party components

### Solution (Phase 3)
1. Add `CustomElement` primitive with sandboxed execution
2. Run custom code in isolated iframe with `postMessage` communication
3. Whitelist allowed imports (e.g., `react`, `recharts`)
4. Validate custom code for security issues

### Schema Extension
```ts
interface CustomUIBlock extends UIBlock {
  type: "custom";
  code: string;              // Raw TSX/JSX code
  allowedImports: string[];  // Whitelist (e.g., ["react", "recharts"])
  sandboxed: true;
}
```

### Security
- No access to `window`, `document`, `localStorage`
- No network requests (use service layer)
- Strict Content Security Policy (CSP)

---

## 19. Import Strategy — Round-Trip Editing (Post-MVP)

### Problem
- Users export app, modify code, and want to re-import into studio
- Parsing TSX → specs is non-deterministic

### Solution (Phase 3)
1. Inject metadata comments in generated files:
   ```tsx
   /**
    * @ui-studio-component
    * @spec-hash abc123
    * @instance-id xyz
    */
   ```
2. Import flow:
   - Parse TSX with Babel/TS parser
   - Extract metadata + reconstruct specs
   - Detect manual edits (hash mismatch)
   - Show diff UI, require user to resolve conflicts

### Schema Extension
```ts
interface InstanceJSON {
  // ... existing fields
  importSource?: {
    type: "export" | "import";
    exportedAt?: number;
    importedAt?: number;
    hasManualEdits: boolean;
  };
}
```

---

## 20. Undo/Redo System (Post-MVP)

### Problem
- Users make mistakes in builder and want to undo

### Solution (Phase 4)
1. Command pattern for all mutations
2. In-memory history stack (max 50 entries, not persisted)
3. Keyboard shortcuts: `Cmd+Z` / `Cmd+Shift+Z`
4. Show undo/redo buttons in UI

### Implementation
```ts
interface HistoryEntry {
  timestamp: number;
  action: string;             // "update_component_prop", "add_service", etc.
  before: Partial<InstanceJSON>;
  after: Partial<InstanceJSON>;
}

class HistoryManager {
  private stack: HistoryEntry[] = [];
  private pointer: number = -1;

  push(entry: HistoryEntry) { /* ... */ }
  undo(): Partial<InstanceJSON> { /* ... */ }
  redo(): Partial<InstanceJSON> { /* ... */ }
}
```

---

## 21. Cloud Export Targets (Post-MVP)

### Problem
- ZIP download is fine for local dev, but users may want to deploy directly

### Solution (Phase 3)
1. Export targets:
   - **ZIP download** (MVP)
   - **GitHub repo** (via GitHub API)
   - **StackBlitz link** (via StackBlitz SDK)
   - **CodeSandbox link**
2. Store API tokens in `secrets` IndexedDB store (encrypted)
3. Add export target selector in UI

### Schema Extension
```ts
interface ExportOptions {
  format: "zip" | "github" | "stackblitz" | "codesandbox";
  githubRepo?: string;       // "username/repo-name"
  private?: boolean;         // Create private repo
}
```

### Example Flow
1. User selects "Export to GitHub"
2. If no GitHub token, prompt OAuth flow
3. Store token in `secrets` IndexedDB store
4. Generate file tree
5. Create repo via GitHub API
6. Push files
7. Return repo URL

---

## Summary of Changes from Original Plan

### MVP Changes (Critical)
1. ✅ **Section 0**: Per-instance locking (not global)
2. ✅ **Section 2**: Added `contexts/` folder to generated structure
3. ✅ **Section 3.3**: Added migration strategy
4. ✅ **Section 4**: Rewritten locking to be per-instance
5. ✅ **Section 5.4**: Added error boundaries
6. ✅ **Section 8**: Extended schemas with `contexts`, `testLevel`, `errorBoundary`, `consumesContexts`
7. ✅ **Section 11**: Added performance limits and error categories
8. ✅ **Section 17**: New section on performance guidelines

### Phase 2 (LLM) Changes
9. ✅ **Section 12**: TOON format for LLM communication (40% token savings)
   - Storage: JSON (IndexedDB, memory)
   - LLM Context: TOON (compact, LLM-optimized)
   - Export: JSON (standard format)

### Post-MVP Additions
10. ✅ **Section 18**: Custom preview elements (sandboxed)
11. ✅ **Section 19**: Import strategy (round-trip editing)
12. ✅ **Section 20**: Undo/redo system
13. ✅ **Section 21**: Cloud export targets (GitHub, StackBlitz)

---

## TOON Usage Summary

**Decision: TOON for LLM Communication Only**

| Aspect | Format | Rationale |
|--------|--------|-----------|
| **IndexedDB Storage** | JSON | Native JavaScript object support |
| **In-Memory State** | JSON | No conversion overhead |
| **Import/Export Files** | JSON | Universal compatibility |
| **LLM Context** | TOON | 40% token savings, better LLM accuracy |
| **Generated React App** | TypeScript/TSX | Standard React code |

**Benefits:**
- ✅ Simple architecture (JSON everywhere except LLM)
- ✅ No TOON dependency until Phase 2 (LLM)
- ✅ Significant cost savings when using LLMs
- ✅ No runtime overhead in builder or preview

**Implementation:**
- Phase 1-4 (MVP): JSON only, no TOON dependency
- Phase 5 (LLM): Add `@toon-format/toon`, use for LLM context

---

**This revised document is the authoritative reference for all agents working on UI Studio.**
