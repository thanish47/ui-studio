# UI Studio - Implementation Overview

## Quick Navigation

1. **[Milestone 1: Core & Persistence](milestone-1-core-persistence.md)** (~1 week)
2. **[Milestone 2: Builder UI](milestone-2-builder.md)** (~2 weeks)
3. **[Milestone 3: Preview](milestone-3-preview.md)** (~1.5 weeks)
4. **[Milestone 4: Generator & Export](milestone-4-generator-export.md)** (~1.5 weeks)
5. **[Milestone 5: LLM Integration](milestone-5-llm-optional.md)** (~1 week, optional)

**Total MVP Effort: ~6 weeks (Milestones 1-4)**
**With LLM: ~7 weeks (All milestones)**

---

## Milestone Summary

### Milestone 1: Core & Persistence ✅ [Start Here]
**Duration:** ~1 week (40 hours)

**What You'll Build:**
- TypeScript schemas for all JSON structures
- Zod validation for data integrity
- IndexedDB adapter for storage
- Per-instance locking mechanism
- Schema migration framework
- Basic home screen to list instances

**Key Deliverables:**
- `src/core/schema/` - All TypeScript interfaces
- `src/core/validation/` - Zod schemas and validators
- `src/core/idb/` - IndexedDB CRUD operations
- `src/core/locks/` - Locking with BroadcastChannel
- `src/core/migrations/` - Migration registry
- `src/app/pages/HomePage.tsx` - Instance management

**Dependencies:** None (start here!)

**Success Criteria:**
- Can create, list, and delete instances
- Validation blocks invalid data
- Locks prevent concurrent edits
- Migrations ready for future changes

---

### Milestone 2: Builder UI
**Duration:** ~2 weeks (84 hours)

**⚠️ IMPORTANT: Review [UX_Plan.md](UX_Plan.md) before starting this milestone**

**What You'll Build:**
- Tree editor with virtualization (handles 1000+ nodes)
- Spec editors for all types (component, service, context, folder)
- UIBlock visual editor
- Mock data editor
- Real-time validation feedback
- Three-panel builder layout

**Key Deliverables:**
- `src/core/graph/` - Tree data structure and operations
- `src/app/pages/BuilderPage.tsx` - Main builder layout
- `src/app/components/TreeEditor/` - Virtualized tree
- `src/app/components/SpecEditors/` - Form editors for each spec type
- `src/app/components/UIBlockEditor/` - Visual UI builder
- `src/app/components/MockEditor/` - Mock data management
- `src/app/components/Validation/` - Validation error display

**Dependencies:** Milestone 1

**Success Criteria:**
- Tree displays entire hierarchy
- All spec types editable
- UIBlocks can be added/removed visually
- Mock data configurable
- Validation errors shown in real-time
- Changes auto-saved

---

### Milestone 3: Preview
**Duration:** ~1.5 weeks (70 hours)

**What You'll Build:**
- All 9 UIBlock primitive components
- Recursive UIBlock renderer
- State binding resolution
- Mock data provider
- Error boundaries
- Component and app preview panels

**Key Deliverables:**
- `src/preview/primitives/` - 9 primitive components (Stack, Card, Button, etc.)
- `src/preview/renderer.tsx` - Recursive UIBlock renderer
- `src/preview/bindings.ts` - State binding resolver
- `src/preview/mockProvider.tsx` - Mock data injection
- `src/preview/errorBoundary.tsx` - Crash prevention
- `src/app/components/Preview/` - Preview panels

**Dependencies:** Milestones 1, 2

**Success Criteria:**
- All primitives render correctly
- State bindings resolve from props/state/context
- Mock data flows to components
- Errors don't crash entire app
- Preview updates on spec changes (debounced)
- Both single-component and full-app preview work

---

### Milestone 4: Generator & Export
**Duration:** ~1.5 weeks (72 hours)

**What You'll Build:**
- Complete code generator (specs → React app)
- Component, service, and context generators
- Test generators (smoke/full based on testLevel)
- Config file generators (Vite, TypeScript, etc.)
- Prettier formatter
- ZIP exporter

**Key Deliverables:**
- `src/generator/fileTree.ts` - Main generator
- `src/generator/config/` - Config file templates
- `src/generator/components/` - Component generator
- `src/generator/services/` - Service generator
- `src/generator/contexts/` - Context generator
- `src/generator/formatter.ts` - Prettier integration
- `src/generator/zipExporter.ts` - ZIP creation
- `src/app/components/Export/` - Export UI

**Dependencies:** Milestones 1, 2, 3

**Success Criteria:**
- Generated app has correct file structure
- All components, services, contexts generated
- Tests generated based on testLevel
- Code formatted with Prettier
- ZIP downloads successfully
- Generated app builds: `npm install && npm test && npm run dev`

---

### Milestone 5: LLM Integration (Optional)
**Duration:** ~1 week (56 hours)

**What You'll Build:**
- TOON encoder integration
- LLM context builder (JSON → TOON)
- OpenAI and Anthropic provider integrations
- Response parser and validator
- Secure API key storage
- AI assistant UI

**Key Deliverables:**
- `src/llm/contextBuilder.ts` - TOON context builder
- `src/llm/providers/` - LLM provider implementations
- `src/llm/parser.ts` - Response parser
- `src/core/idb/secretsRepository.ts` - Encrypted key storage
- `src/app/components/LLM/` - Settings and assistant UI

**Dependencies:** Milestones 1, 2, 3, 4

**Success Criteria:**
- TOON encoding reduces tokens by ~40%
- OpenAI provider works
- Anthropic provider works
- API keys stored securely
- Generated specs validated before acceptance
- AI assistant integrated in builder

**Note:** This milestone is optional. The MVP (Milestones 1-4) is fully functional without it.

---

## Development Workflow

### Phase 1: Setup (Days 1-2)
1. Initialize project with Vite + React + TypeScript
2. Set up ESLint, Prettier
3. Install core dependencies (Zod, IDB, React Window)
4. Create folder structure

### Phase 2: Foundation (Week 1)
**Milestone 1: Core & Persistence**
- Define all schemas
- Implement validation
- Build IndexedDB adapter
- Add locking mechanism
- Create home screen

### Phase 3: Builder (Weeks 2-3)
**Milestone 2: Builder UI**
- **⚠️ Before Week 2:** Complete UX mockups based on [UX_Plan.md](UX_Plan.md)
- Build tree editor
- Create spec editors
- Add UIBlock editor
- Implement mock editor
- Add validation feedback

### Phase 4: Preview (Week 4-5)
**Milestone 3: Preview**
- Implement primitives
- Build renderer
- Add mock provider
- Integrate preview panel

### Phase 5: Export (Week 5-6)
**Milestone 4: Generator & Export**
- Build generators
- Add formatting
- Create ZIP exporter
- Test generated apps

### Phase 6: LLM (Week 7, Optional)
**Milestone 5: LLM Integration**
- Integrate TOON
- Add providers
- Build UI

---

## Testing Strategy

### Per Milestone
Each milestone includes:
- **Unit tests** - Individual functions and components
- **Integration tests** - Full workflows
- **Manual testing** - User experience validation

### End-to-End Testing (After Milestone 4)
1. Create new instance
2. Add components, services, contexts
3. Edit specs
4. Preview components
5. Validate (no errors)
6. Export as ZIP
7. Extract and run:
   ```bash
   npm install
   npm test    # All tests pass
   npm run dev # App runs
   ```

---

## Key Technologies

### Core Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zod** - Runtime validation
- **IDB** - IndexedDB wrapper

### Builder
- **React Window** - Virtualization
- **BroadcastChannel** - Tab communication

### Preview
- **React Error Boundary** - Error handling

### Generator
- **Prettier** - Code formatting
- **JSZip** - ZIP creation

### LLM (Optional)
- **@toon-format/toon** - Token optimization
- **OpenAI SDK** - GPT integration
- **Anthropic SDK** - Claude integration

---

## File Structure After Completion

```
ui-studio/
├── src/
│   ├── app/                    # Builder UI
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   └── BuilderPage.tsx
│   │   ├── components/
│   │   │   ├── TreeEditor/
│   │   │   ├── SpecEditors/
│   │   │   ├── UIBlockEditor/
│   │   │   ├── MockEditor/
│   │   │   ├── Validation/
│   │   │   ├── Preview/
│   │   │   ├── Export/
│   │   │   └── LLM/
│   │   └── hooks/
│   │       ├── useInstance.ts
│   │       ├── useLock.ts
│   │       └── useTree.ts
│   │
│   ├── core/                   # Business logic
│   │   ├── schema/
│   │   ├── validation/
│   │   ├── graph/
│   │   ├── idb/
│   │   ├── locks/
│   │   └── migrations/
│   │
│   ├── generator/              # Code generator
│   │   ├── config/
│   │   ├── components/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── app/
│   │   ├── formatter.ts
│   │   └── zipExporter.ts
│   │
│   ├── preview/                # Preview renderer
│   │   ├── primitives/
│   │   ├── renderer.tsx
│   │   ├── bindings.ts
│   │   ├── mockProvider.tsx
│   │   └── errorBoundary.tsx
│   │
│   ├── llm/                    # LLM (optional)
│   │   ├── providers/
│   │   ├── contextBuilder.ts
│   │   └── parser.ts
│   │
│   └── utils/                  # Helpers
│
├── templates/                  # App templates
├── docs/                       # Documentation
│   ├── app_design.md
│   ├── implementation-overview.md
│   ├── UX_Plan.md
│   ├── milestone-1-core-persistence.md
│   ├── milestone-2-builder.md
│   ├── milestone-3-preview.md
│   ├── milestone-4-generator-export.md
│   └── milestone-5-llm-optional.md
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── plan.md                     # Reference plan
```

---

## Success Metrics

### MVP Complete (Milestones 1-4)
- ✅ Can create and manage instances
- ✅ Can build app specs with builder UI
- ✅ Can preview components and app
- ✅ Can export production-ready React app
- ✅ Generated app builds and tests pass
- ✅ All validation rules enforced

### With LLM (Milestone 5)
- ✅ AI can generate specs from prompts
- ✅ Token usage reduced by ~40% vs JSON
- ✅ Multiple LLM providers supported

---

## Next Steps

1. **Read [plan.md](../plan.md)** for full architectural details
2. **Read [UX_Plan.md](UX_Plan.md)** for design specifications (critical before Milestone 2)
3. **Start with [Milestone 1](milestone-1-core-persistence.md)**
4. Work through milestones sequentially
5. Test thoroughly after each milestone
6. Deploy MVP after Milestone 4

---

## Questions or Issues?

- Check the [plan.md](../plan.md) for architectural decisions
- Review milestone docs for implementation details
- Validate against Definition of Done for each milestone

**Good luck building UI Studio! 🚀**
