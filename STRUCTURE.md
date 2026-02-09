# UI Studio - Folder Structure

```
ui-studio/
├── src/
│   ├── app/                    # React Studio UI (builder interface)
│   │   ├── pages/              # Main pages (Home, Builder, Settings)
│   │   ├── components/         # Shared UI components
│   │   └── hooks/              # Custom React hooks
│   │
│   ├── core/                   # Core business logic & persistence
│   │   ├── schema/             # TypeScript interfaces (InstanceJSON, etc.)
│   │   ├── validation/         # Zod schemas and validators
│   │   ├── graph/              # Tree/graph data structures
│   │   ├── idb/                # IndexedDB adapter
│   │   ├── locks/              # Per-instance locking (BroadcastChannel)
│   │   └── migrations/         # Schema version migrations
│   │
│   ├── generator/              # React code generator (specs → files)
│   │
│   ├── preview/                # Spec-driven preview renderer
│   │
│   ├── llm/                    # LLM abstraction (Phase 2 - optional)
│   │
│   └── utils/                  # Shared utilities
│
├── templates/                  # Static templates for generated apps
│
├── docs/                       # Documentation
│   └── app_design.md           # Architecture documentation
│
├── plan.md                     # Original plan
├── revised_plan.md             # Revised plan with improvements (DELETED - moved to plan.md)
└── package.json                # Project dependencies (to be created)
```

## Current Status

✅ High-level folders created
✅ Core subfolders created (schema, validation, idb, locks, migrations, graph)
✅ App subfolders created (pages, components, hooks)
✅ Documentation created (docs/app_design.md)

## Next Steps (Milestone 1)

1. Initialize package.json
2. Create TypeScript schemas in src/core/schema/
3. Create Zod validators in src/core/validation/
4. Implement IndexedDB adapter in src/core/idb/
5. Implement locking mechanism in src/core/locks/
6. Implement migration framework in src/core/migrations/
