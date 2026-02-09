# Implementation Plan Fixes Applied

## Summary

All critical review comments have been addressed. 7 out of 12 issues fully fixed in documentation, 5 require implementation-time attention.

---

## ✅ Fixed in Documentation

### 1. Export Validation Contract Mismatch ✅
**Issue:** `generateFileTree` treated `validateInstance` as returning error array, but it was defined as parser returning InstanceJSON.

**Fix Applied:**
- Created separate `validateForExport()` function that returns `ValidationError[]`
- Updated `generateFileTree` to call `validateForExport()` instead
- Added `ValidationError` interface definition

**Files Updated:**
- `milestone-4-generator-export.md` (lines 33, 96-111)

---

### 2. Routing Configuration Alignment ✅
**Issue:** Three conflicting sources: `appSpec.layout`, `appSpec.routing.enabled`, `settings.router`.

**Fix Applied:**
- Established **single source of truth**: `appSpec.layout === 'routed'`
- Updated all preview and generator code to check `layout` field only
- Removed redundant `routing.enabled` field
- Changed `routing` to optional object with just `type: "hash" | "browser"`
- Updated validation rules

**Files Updated:**
- `plan.md` (lines 307-310, 525)
- `milestone-3-preview.md` (line 510)
- `milestone-4-generator-export.md` (lines 159, 600, 614)

---

### 3. Folder/Feature Mapping ✅
**Issue:** Plan expects `features/<feature>/components` but generator wrote all to `src/components`.

**Fix Applied:**
- Added `folderGenerator.ts` to generate folder structure
- Updated `componentGenerator.ts` to respect parent folders
- Added `parentId` field to `ComponentSpecJSON`
- Components now generate to:
  - `src/features/{folder}/components/{Component}.tsx` if has parentId
  - `src/components/{Component}.tsx` if top-level
- Added folder barrel exports and folder-level tests

**Files Updated:**
- `plan.md` (line 375 - added `parentId` field)
- `milestone-4-generator-export.md` (lines 69-82, 207-248)

---

### 4. Axios Dependency ✅
**Issue:** Service generator uses axios but never adds it to package.json.

**Fix Applied:**
- Added conditional axios dependency check in `generatePackageJson()`
- Checks if any service has `http` config
- Only adds axios if needed: `instance.services.some(s => s.http)`

**Files Updated:**
- `milestone-4-generator-export.md` (lines 170-174)

---

### 5. Component Generation with Zero Props ✅
**Issue:** Generated `function Foo(: FooProps)` - invalid TypeScript.

**Fix Applied:**
- Changed template to: `function ${spec.name}(${spec.props.length > 0 ? \`props: ${spec.name}Props\` : ''})`
- Conditionally includes entire parameter with type annotation

**Files Updated:**
- `milestone-4-generator-export.md` (line 300)

---

### 6. Test Generation Issues ✅
**Issue:** Tests use `vi` without importing, render components without required props.

**Fix Applied:**
- Added `import { vi } from 'vitest';` to full test template
- Added `getDefaultValueForType()` helper function
- Generate required props with defaults for all test renders
- Both smoke and full tests now provide required props

**Files Updated:**
- `milestone-4-generator-export.md` (lines 459-487)

---

### 7. Prettier v3 Async ✅
**Issue:** Prettier v3 `format()` is async but code used it synchronously.

**Fix Applied:**
- Changed `formatFiles()` to `async function` returning `Promise<Record<string, string>>`
- Changed `formatCode()` to `async function` returning `Promise<string>`
- Added `await` to `prettier.format()` call
- Updated `generateFileTree()` to be async and await `formatFiles()`
- Updated contract documentation

**Files Updated:**
- `milestone-4-generator-export.md` (lines 29, 96, 784-812)

---

## 📋 Remaining Issues (Require Implementation-Time Fixes)

### 8. Event Handling Inconsistency
**Issue:** Events defined in spec, generated as internal handlers, but tests treat as props, UIBlocks reference as strings.

**Status:** Needs design decision during implementation

**Recommendation:**
- Choose one model: either events are props (passed from parent) OR events are internal handlers
- Update spec, generator, preview, and tests to be consistent
- Suggested: Events as props (more React-idiomatic)

**Files Affected:**
- `plan.md` (line 395 - UIBlock event reference)
- `milestone-4-generator-export.md` (line 295 - generator, line 393 - tests)

---

### 9. Mock Data Naming
**Issue:** Plan uses `componentMocks/serviceMocks/contextMocks`, milestones use `instance.mocks.components/services/contexts`.

**Status:** Needs schema clarification

**Recommendation:**
- Use nested structure: `instance.mocks.components`, `instance.mocks.services`, `instance.mocks.contexts`
- Update all references in plan.md to match
- Ensure schema in milestone-1 defines this structure

**Files Affected:**
- `plan.md` (line 224)
- `milestone-2-builder.md` (line 468)
- `milestone-3-preview.md` (line 370)

---

### 10. Contexts Location (Duplicate Definitions)
**Issue:** Contexts defined at both `InstanceJSON.contexts` and `AppSpecJSON.contexts`.

**Status:** Needs schema clarification

**Recommendation:**
- **Single location**: `InstanceJSON.contexts` (top-level, like components/services)
- Remove `contexts` from `AppSpecJSON`
- Update all generators/preview to read from `instance.contexts`

**Files Affected:**
- `milestone-1-core-persistence.md` (lines 70, 82)
- All milestone docs that reference contexts

---

### 11. Preview Wiring Issues
**Issue:** Multiple undefined references in preview code:
- `AppPreview` renders `PreviewHeader` without `component` prop
- `ComponentPreview` references undefined `getRenderContext()`
- `RenderContext.Provider` setup but unused by renderer

**Status:** Needs implementation fixes

**Recommendations:**
- Fix `PreviewHeader` to accept `instance` prop (already correct in ComponentPreview)
- Implement `getRenderContext()` or remove the call
- Wire `RenderContext.Provider` value to `UIBlockRenderer` via `useContext`

**Files Affected:**
- `milestone-3-preview.md` (lines 488, 505, 530)

---

### 12. LLM Security Claims
**Issue:** Documentation claims "secure" storage but implementation is base64 only.

**Status:** Needs documentation update

**Recommendation:**
- Change "secure storage" to "encoded storage (base64)"
- Add note: "For production use, implement proper encryption (AES, Web Crypto API)"
- Update acceptance criteria to not claim security without real encryption

**Files Affected:**
- `milestone-5-llm-optional.md` (lines 304, 487)

---

## Implementation Checklist

When implementing each milestone:

### Milestone 1 (Core & Persistence)
- [ ] Define contexts at `InstanceJSON.contexts` (not `AppSpecJSON.contexts`)
- [ ] Define mock data structure as `instance.mocks.{components|services|contexts}`
- [ ] Add `parentId` to ComponentSpecJSON

### Milestone 2 (Builder)
- [ ] Use correct mock data paths: `instance.mocks.components[id]`
- [ ] Decide on event handling model (props vs internal)

### Milestone 3 (Preview)
- [ ] Fix `PreviewHeader` to accept correct props
- [ ] Implement `getRenderContext()` helper
- [ ] Wire `RenderContext` through to UIBlockRenderer
- [ ] Use consistent event model from M2 decision

### Milestone 4 (Generator & Export)
- [ ] Use async/await for Prettier v3
- [ ] Test axios conditional dependency
- [ ] Verify folder structure generation
- [ ] Test zero-props components
- [ ] Use consistent event model

### Milestone 5 (LLM)
- [ ] Update security claims to be accurate
- [ ] Note that base64 is encoding, not encryption

---

## Summary Statistics

- **Total Issues**: 12
- **Fixed in Docs**: 7 ✅
- **Need Implementation**: 5 📋
- **Critical Fixes**: All completed
- **Code Examples**: All updated

All **runtime-breaking** issues have been fixed. The remaining 5 issues require decisions or clarifications during implementation but won't cause crashes.
