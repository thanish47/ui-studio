# UI Studio Documentation

This folder contains all implementation documentation for the UI Studio project.

## 📚 Documentation Index

### Overview
- **[implementation-overview.md](implementation-overview.md)** - Start here! High-level overview of all milestones, timelines, and workflow

### Architecture
- **[app_design.md](app_design.md)** - Detailed folder structure and architecture explanation
- **[../plan.md](../plan.md)** - Complete reference plan with all specifications

### Design
- **[UX_Plan.md](UX_Plan.md)** - ⚠️ **Critical before Milestone 2!** Three-panel layout design, keyboard shortcuts, design system, and component specifications

### Implementation Milestones

Each milestone document contains:
- Detailed task breakdown
- Code examples and templates
- Acceptance criteria
- Testing strategy
- Estimated effort

1. **[milestone-1-core-persistence.md](milestone-1-core-persistence.md)** (~1 week)
   - TypeScript schemas
   - Zod validation
   - IndexedDB storage
   - Locking mechanism
   - Migration framework
   - Home screen

2. **[milestone-2-builder.md](milestone-2-builder.md)** (~2 weeks)
   - Tree editor with virtualization
   - Spec editors (component, service, context, folder)
   - UIBlock visual editor
   - Mock data editor
   - Validation feedback UI

3. **[milestone-3-preview.md](milestone-3-preview.md)** (~1.5 weeks)
   - 9 UIBlock primitives
   - Recursive renderer
   - State binding resolution
   - Mock provider
   - Error boundaries
   - Preview panels

4. **[milestone-4-generator-export.md](milestone-4-generator-export.md)** (~1.5 weeks)
   - Code generator (specs → React app)
   - Component, service, context generators
   - Test generators
   - Config file templates
   - Prettier formatting
   - ZIP export

5. **[milestone-5-llm-optional.md](milestone-5-llm-optional.md)** (~1 week, optional)
   - TOON encoder integration
   - LLM context builder
   - OpenAI/Anthropic providers
   - Response parser
   - API key management
   - AI assistant UI

---

## 🚀 Quick Start

1. **Read** [implementation-overview.md](implementation-overview.md) for the big picture
2. **Review** [../plan.md](../plan.md) for architectural decisions
3. **Start** with [milestone-1-core-persistence.md](milestone-1-core-persistence.md)
4. **⚠️ Before Week 2:** Review [UX_Plan.md](UX_Plan.md) and complete UX mockups
5. **Work through** milestones sequentially (1 → 2 → 3 → 4)
6. **Optionally add** Milestone 5 (LLM) after completing MVP

---

## 📊 Summary Statistics

| Milestone | Duration | Files Created | Key Features |
|-----------|----------|---------------|--------------|
| **M1: Core** | 1 week | ~20 files | Schemas, validation, storage, locking |
| **M2: Builder** | 2 weeks | ~35 files | Tree editor, spec editors, validation UI |
| **M3: Preview** | 1.5 weeks | ~25 files | Primitives, renderer, mock provider |
| **M4: Generator** | 1.5 weeks | ~30 files | Code gen, tests, formatting, export |
| **M5: LLM** | 1 week | ~15 files | TOON, providers, AI assistant |
| **Total MVP** | **6 weeks** | **~110 files** | Fully functional no-code studio |
| **With LLM** | **7 weeks** | **~125 files** | + AI-assisted generation |

---

## 🎯 Key Principles

1. **Spec-driven** - JSON specs are the source of truth
2. **Deterministic** - Same input always produces same output
3. **Validated** - Strict validation prevents invalid exports
4. **Tested** - Every generated component has tests
5. **Production-ready** - Generated apps are deployment-ready

---

## 🔧 Technology Stack

- **React 18** + **TypeScript** - Type-safe UI
- **Vite** - Fast dev server and builds
- **Zod** - Runtime validation
- **IndexedDB** - Client-side storage
- **React Window** - Virtualization for performance
- **Prettier** - Code formatting
- **JSZip** - ZIP creation
- **TOON** (optional) - Token optimization for LLMs

---

## 📝 Documentation Format

Each milestone document follows this structure:
- **Overview** - What you'll build
- **Prerequisites** - Required milestones
- **Tasks** - Detailed task breakdown with code examples
- **Testing Strategy** - Unit, integration, and manual tests
- **Definition of Done** - Acceptance criteria
- **Estimated Effort** - Time breakdown

---

## 🤝 Contributing

When implementing:
1. Follow the milestone order (dependencies matter!)
2. Complete all acceptance criteria before moving on
3. Write tests as you go
4. Update documentation if you deviate from the plan
5. Validate against Definition of Done

---

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [TOON Format Spec](https://github.com/toon-format/spec) (for Milestone 5)

---

**Ready to build? Start with [implementation-overview.md](implementation-overview.md)!**
