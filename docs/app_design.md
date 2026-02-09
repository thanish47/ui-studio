# UI Studio - Application Design

## Folder Structure

### src/app/
React Studio UI - the builder interface where users create and manage their projects.

**Structure:**
- **pages/** - Main application pages (Home, Builder, Settings)
- **components/** - Shared UI components (buttons, forms, dialogs)
- **hooks/** - Custom React hooks for app logic

**Responsibilities:**
- Instance home screen (list, create, delete instances)
- Builder UI (tree editor, spec editors, preview panel)
- Navigation and routing
- User interactions and state management

---

### src/core/
Core business logic, schemas, validation, and persistence.

**Structure:**
- **schema/** - TypeScript interfaces for all JSON schemas (InstanceJSON, AppSpecJSON, ComponentSpecJSON, etc.)
- **validation/** - Zod schemas and validation logic
- **graph/** - Tree/graph data structure and traversal utilities
- **idb/** - IndexedDB adapter and query utilities
- **locks/** - Per-instance locking mechanism with BroadcastChannel
- **migrations/** - Schema version migrations

**Responsibilities:**
- Define the source of truth schemas
- Validate all data before storage/export
- Manage IndexedDB storage and queries
- Handle per-instance locking across tabs
- Migrate old schemas to new versions

---

### src/generator/
React code generator - converts specs to production-ready React apps.

**Structure:**
- **templates/** - Code templates for components, services, contexts, config files
- **fileTree.ts** - Main file tree generator
- **formatters.ts** - Prettier integration

**Responsibilities:**
- Generate deterministic file tree from InstanceJSON
- Create all component files (.tsx) with tests (.spec.tsx)
- Create service files (.ts) with tests (.spec.ts)
- Generate context providers
- Create config files (vite.config.ts, tsconfig.json, package.json)
- Format all generated code with Prettier
- Export as ZIP

---

### src/preview/
Spec-driven preview renderer - renders UI from ComponentSpecJSON without executing TSX.

**Structure:**
- **primitives/** - React components for each UIBlock type (Stack, Card, Button, etc.)
- **renderer.tsx** - Recursive UIBlock renderer
- **errorBoundary.tsx** - Preview error boundary
- **mockProvider.tsx** - Mock data and context provider

**Responsibilities:**
- Render preview from specs (no runtime TSX execution)
- Provide mock data for props, services, and contexts
- Handle preview errors with fallback UI
- Support 9 core primitives (Stack, Card, Heading, Text, Button, Input, Select, Table, Alert)

---

### src/llm/ (Phase 2)
LLM abstraction layer for AI-assisted spec generation.

**Structure:**
- **providers/** - Provider implementations (OpenAI, Anthropic, etc.)
- **contextBuilder.ts** - Builds TOON-encoded context for LLMs
- **parser.ts** - Parses and validates LLM responses

**Responsibilities:**
- Convert JSON specs to TOON format (40% token savings)
- Send context to LLM providers
- Parse LLM responses back to JSON
- Validate LLM-generated specs
- Manage API keys in encrypted storage

**Note:** This folder is not needed for MVP (Milestones 1-4)

---

### src/utils/
Shared utility functions used across the application.

**Responsibilities:**
- String formatting and validation
- Date/time utilities
- ID generation
- General helpers

---

### templates/
Static templates and fragments for the generated React app.

**Contents:**
- Base HTML template (index.html)
- Package.json template
- Config file templates
- Common code snippets

---

### docs/
Documentation for the project.

**Files:**
- **app_design.md** - This file (application design and architecture)
- **api.md** - API documentation (future)
- **contributing.md** - Contribution guidelines (future)

---

## Implementation Phases

### Milestone 1 - Core & Persistence ✅ (Current)
Folders needed:
- src/core/schema
- src/core/validation
- src/core/idb
- src/core/locks
- src/core/migrations
- src/app/pages
- src/app/components

### Milestone 2 - Builder
Focus on:
- src/app/ (tree editor, spec editors, mock data editor)
- src/core/graph (tree operations)

### Milestone 3 - Preview
Focus on:
- src/preview/ (all files)

### Milestone 4 - Generator & Export
Focus on:
- src/generator/ (all files)
- templates/ (all templates)

### Milestone 5 - LLM (Optional)
Focus on:
- src/llm/ (all files)
