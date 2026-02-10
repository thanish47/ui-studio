# UI Studio - UX Design Plan

## Overview

This document details the **Three-Panel VSCode-Style Layout** for the UI Studio builder interface. This design was selected as the primary UX approach because it:

1. **Aligns with plan.md constraints** - No visual drag-and-drop editor, form + tree only
2. **Matches Milestone 2 requirements** - Three-panel builder layout specification
3. **Fits developer expectations** - Familiar VSCode-style interface
4. **Scales to complexity** - Handles 1000+ nodes with virtualization
5. **Supports rapid navigation** - Keyboard shortcuts and command palette

---

## When to Implement

**Critical Timing:** Complete UX design **before starting Milestone 2 (Builder UI)**

### Recommended Timeline

- **Before Week 2 (Days 1-7 of project):**
  - Finalize UX mockups and wireframes
  - Validate layout with stakeholders
  - Create component design system
  - Define keyboard shortcuts
  - Plan responsive behavior

- **During Week 1 (Milestone 1):**
  - Work on UX design in parallel with core/persistence implementation
  - No dependencies on Milestone 1 code
  - Ready to hand off to Milestone 2 implementation

---

## The Three-Panel Layout

### Visual Structure

```
┌──────────────────────────────────────────────────────────────┐
│  UI Studio - MyApp                                    [⚙ ✓]  │
├──────────────┬──────────────────────────┬────────────────────┤
│              │                          │                    │
│  Tree Panel  │    Editor Panel          │  Preview Panel     │
│  (20%)       │    (50%)                 │  (30%)             │
│              │                          │                    │
│ ┌──────────┐ │ ┌──────────────────────┐ │ ┌────────────────┐ │
│ │ 📁 App   │ │ │ Component Editor     │ │ │ Live Preview   │ │
│ │ └ 📁 feat│ │ │                      │ │ │                │ │
│ │   └ 📄 H │ │ │ Name: [Header     ]  │ │ │ ┌────────────┐ │ │
│ │   └ 📄 N │ │ │ Type: [Component ▼]  │ │ │ │  Header    │ │ │
│ │ 📁 Servic│ │ │                      │ │ │ │  [Nav]     │ │ │
│ │ └ 📄 API │ │ │ Props:               │ │ │ └────────────┘ │ │
│ │ 📁 Contex│ │ │ ┌─────────────────┐  │ │ │                │ │
│ │ └ 📄 Auth│ │ │ │ + title: string │  │ │ │ [Update] [⟳]  │ │
│ │          │ │ │ │ + logo?: string │  │ │ │                │ │
│ │ [+ Add]  │ │ │ └─────────────────┘  │ │ └────────────────┘ │
│ │          │ │ │                      │ │                    │
│ │ [🔍]     │ │ │ UIBlocks:            │ │                    │
│ └──────────┘ │ │ ┌──────────────────┐ │ │                    │
│              │ │ │ Stack (vertical) │ │ │                    │
│              │ │ │ └ Heading        │ │ │                    │
│              │ │ │ └ Stack (horiz.) │ │ │                    │
│              │ │ │   └ Button       │ │ │                    │
│              │ │ └──────────────────┘ │ │                    │
│              │ │                      │ │                    │
│              │ │ [+ Add UIBlock]      │ │                    │
│              │ └──────────────────────┘ │                    │
│              │                          │                    │
└──────────────┴──────────────────────────┴────────────────────┘
│ ✓ Saved • 12 components • 3 services • 2 contexts           │
└──────────────────────────────────────────────────────────────┘
```

---

## Panel Breakdown

### 1. Tree Panel (Left, 20% width)

**Purpose:** Navigate entire instance hierarchy

**Features:**
- **Virtualized tree** (react-window) - Handles 1000+ nodes
- **Hierarchical display:**
  - 📁 Folders (features)
  - 📄 Components
  - 🔌 Services
  - 🌐 Contexts
- **Visual indicators:**
  - ⚠️ Validation errors (red badge)
  - 🔍 Search results (highlight)
  - 📍 Current selection (blue highlight)
- **Actions:**
  - Click to select
  - Right-click context menu (delete, duplicate, rename)
  - Drag to reorder (within same parent)
  - Collapse/expand folders
- **Bottom toolbar:**
  - [+ Add] button (dropdown: Component, Service, Context, Folder)
  - [🔍] Search input (filters tree in real-time)

**Keyboard Shortcuts:**
- `↑↓` - Navigate tree
- `←→` - Collapse/expand
- `Enter` - Edit selected item
- `Cmd+F` - Focus search
- `Cmd+N` - New component
- `Delete` - Delete selected (with confirmation)

**Implementation Notes:**
- Use `react-window` FixedSizeList with tree flattening
- Store expanded state in local state (not IndexedDB)
- Debounce search input (300ms)
- Highlight first match when searching

---

### 2. Editor Panel (Center, 50% width)

**Purpose:** Edit specs for selected tree item

**Dynamic Content Based on Selection:**

#### 2.1 Component Editor
```
┌────────────────────────────────────────┐
│ Component Editor                       │
├────────────────────────────────────────┤
│ Name:     [Header________________]     │
│ Type:     [Component ▼]               │
│                                        │
│ Props:                          [+Add] │
│ ┌────────────────────────────────────┐ │
│ │ ✓ title: string (required)         │ │
│ │ ✓ logo?: string (optional)         │ │
│ │ ✓ onLogout: () => void (required)  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ State:                          [+Add] │
│ ┌────────────────────────────────────┐ │
│ │ ✓ isMenuOpen: boolean = false      │ │
│ └────────────────────────────────────┘ │
│                                        │
│ UIBlocks:                              │
│ ┌────────────────────────────────────┐ │
│ │ Stack (vertical)            [⋮]    │ │
│ │ ├─ Heading                  [⋮]    │ │
│ │ │  text: {prop.title}              │ │
│ │ ├─ Stack (horizontal)       [⋮]    │ │
│ │ │  ├─ Button              [⋮]      │ │
│ │ │  │  text: "Logout"               │ │
│ │ │  │  onClick: {prop.onLogout}     │ │
│ └────────────────────────────────────┘ │
│                              [+Add UIBlock] │
│                                        │
│ Test Level: [Full ▼]                  │
│ Test Coverage: 85% (3/3 props tested) │
└────────────────────────────────────────┘
```

**Features:**
- **Form-based editing** (no visual drag-and-drop)
- **Props editor:**
  - Add/remove props
  - Set type (string, number, boolean, array, object, function)
  - Mark as optional
  - Set default value
- **State editor:**
  - Add/remove state variables
  - Set type and initial value
- **UIBlocks tree editor:**
  - Nested tree view (not visual drag-and-drop)
  - Click [⋮] menu to edit/delete/move
  - [+Add UIBlock] opens primitive selector
  - Inline editing for bindings: `{prop.title}`, `{state.isMenuOpen}`
- **Validation feedback:**
  - Real-time validation as you type
  - Error messages inline (red text)
  - Warning badge on tree item

#### 2.2 Service Editor
```
┌────────────────────────────────────────┐
│ Service Editor                         │
├────────────────────────────────────────┤
│ Name:     [AuthService___________]     │
│ Type:     [HTTP ▼]                     │
│                                        │
│ HTTP Configuration:                    │
│ Base URL: [/api/auth__________]        │
│                                        │
│ Methods:                        [+Add] │
│ ┌────────────────────────────────────┐ │
│ │ ✓ login(username, password)        │ │
│ │   → POST /login                    │ │
│ │   → Returns: { token: string }     │ │
│ │ ✓ logout()                         │ │
│ │   → POST /logout                   │ │
│ │   → Returns: void                  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Test Level: [Smoke ▼]                 │
└────────────────────────────────────────┘
```

#### 2.3 Context Editor
```
┌────────────────────────────────────────┐
│ Context Editor                         │
├────────────────────────────────────────┤
│ Name:     [AuthContext___________]     │
│                                        │
│ Shape:                          [+Add] │
│ ┌────────────────────────────────────┐ │
│ │ ✓ user: User | null                │ │
│ │ ✓ isAuthenticated: boolean         │ │
│ │ ✓ login: (token: string) => void   │ │
│ │ ✓ logout: () => void               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Test Level: [None ▼]                  │
└────────────────────────────────────────┘
```

#### 2.4 Folder Editor
```
┌────────────────────────────────────────┐
│ Folder Editor                          │
├────────────────────────────────────────┤
│ Name:     [authentication________]     │
│ Type:     Feature                      │
│                                        │
│ Description:                           │
│ ┌────────────────────────────────────┐ │
│ │ User authentication and session    │ │
│ │ management components              │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Contents: 3 components, 1 service      │
└────────────────────────────────────────┘
```

#### 2.5 App Spec Editor (when App node selected)
```
┌────────────────────────────────────────┐
│ App Configuration                      │
├────────────────────────────────────────┤
│ Name:     [MyApp_________________]     │
│ Layout:   [Routed ▼]                   │
│ Routing:  [Browser ▼]                  │
│                                        │
│ Root Component: [App ▼]               │
│                                        │
│ Routes (3):                     [+Add] │
│ ┌────────────────────────────────────┐ │
│ │ ✓ / → HomePage                     │ │
│ │ ✓ /dashboard → DashboardPage       │ │
│ │ ✓ /settings → SettingsPage         │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Test Level: [Full ▼]                  │
│ Generate Tests: ✓ Components          │
│                ✓ Services             │
│                □ Contexts             │
└────────────────────────────────────────┘
```

**Keyboard Shortcuts:**
- `Cmd+S` - Save (auto-save is on, but forces immediate)
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Tab` - Next field
- `Shift+Tab` - Previous field

**Implementation Notes:**
- Use controlled inputs with debounced saves (500ms)
- Real-time Zod validation on blur
- Show validation errors inline with error messages
- Disable [Save] button when invalid
- Use React Hook Form for complex forms

---

### 3. Preview Panel (Right, 30% width)

**Purpose:** Live preview of selected component or app

**Features:**

#### 3.1 Component Preview (when component selected)
```
┌────────────────────────────────────┐
│ Preview: Header                    │
├────────────────────────────────────┤
│ Mock Data:                  [Edit] │
│ title: "My App"                    │
│ logo: "/logo.png"                  │
│ onLogout: () => console.log()      │
├────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ My App                [Logout]┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                    │
│ [Update] [⟳ Refresh]               │
└────────────────────────────────────┘
```

#### 3.2 App Preview (when App node selected)
```
┌────────────────────────────────────┐
│ App Preview                        │
├────────────────────────────────────┤
│ Route: [/ ▼]                       │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ Header                         ┃  │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  │
│ ┃ HomePage                       ┃  │
│ ┃ Welcome to MyApp!              ┃  │
│ ┃ [Get Started]                  ┃  │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  │
│ ┃ Footer                         ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                    │
│ [⟳ Refresh]                        │
└────────────────────────────────────┘
```

**Features:**
- **Live updates** - Debounced refresh on spec changes (1s)
- **Mock data** - Click [Edit] to customize mock values
- **Error boundary** - Shows friendly error if preview crashes
- **Refresh button** - Manual refresh if needed
- **Route selector** - For routed apps, switch routes

**Implementation Notes:**
- Use UIBlockRenderer from Milestone 3
- Wrap in error boundary
- Debounce updates to avoid flicker
- Show loading spinner during refresh

---

## Top Bar

```
┌──────────────────────────────────────────────────────────────┐
│  UI Studio - MyApp                          [⚙ Settings] [✓ Validate]  │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- **App name** - Click to edit
- **[⚙ Settings] button** - Opens settings dialog:
  - Theme (light/dark)
  - Auto-save interval
  - LLM provider (if Milestone 5 implemented)
- **[✓ Validate] button** - Run full validation:
  - Shows validation panel at bottom
  - Lists all errors/warnings
  - Click error to jump to tree item

---

## Bottom Status Bar

```
┌──────────────────────────────────────────────────────────────┐
│ ✓ Saved • 12 components • 3 services • 2 contexts • 0 errors │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- **Save status** - "✓ Saved" or "⋯ Saving" or "⚠ Not saved"
- **Entity counts** - Quick overview
- **Error count** - Click to open validation panel

---

## Responsive Behavior

### Panel Resizing
- **Drag dividers** between panels to resize
- **Min widths:**
  - Tree: 200px
  - Editor: 400px
  - Preview: 300px
- **Persist widths** in localStorage

### Panel Collapsing
- **Collapse buttons** on each panel header
- **Keyboard shortcuts:**
  - `Cmd+B` - Toggle tree panel
  - `Cmd+Shift+P` - Toggle preview panel
- **Collapsed state:**
  - Tree: Show icon-only vertical bar
  - Preview: Full width for editor

### Tablet/Mobile (< 768px)
- **Stack panels vertically:**
  1. Tree (top, 200px height, collapsible)
  2. Editor (middle, flexible)
  3. Preview (bottom, 300px height, collapsible)
- **Default:** Tree and preview collapsed
- **Tap icons** to expand panels

---

## Keyboard Shortcuts Summary

### Global
- `Cmd+K` - Open command palette
- `Cmd+S` - Force save
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+F` - Focus search
- `Cmd+N` - New component
- `Cmd+E` - Export as ZIP
- `Cmd+,` - Open settings

### Navigation
- `↑↓` - Navigate tree
- `←→` - Collapse/expand tree node
- `Enter` - Edit selected item
- `Delete` - Delete selected item
- `Cmd+B` - Toggle tree panel
- `Cmd+Shift+P` - Toggle preview panel

### Editor
- `Tab` - Next field
- `Shift+Tab` - Previous field
- `Cmd+Enter` - Add new item (prop/state/UIBlock)

---

## Command Palette

**Trigger:** `Cmd+K`

```
┌──────────────────────────────────────────────┐
│ > _                                          │
├──────────────────────────────────────────────┤
│ New Component                         Cmd+N  │
│ New Service                                  │
│ New Context                                  │
│ New Folder                                   │
│ ──────────────────────────────────────────── │
│ Validate All                          Cmd+V  │
│ Export as ZIP                         Cmd+E  │
│ Settings                              Cmd+,  │
│ ──────────────────────────────────────────── │
│ Go to Component...                    Cmd+P  │
│ Search Tree...                        Cmd+F  │
└──────────────────────────────────────────────┘
```

**Features:**
- Fuzzy search (type to filter)
- Recent actions (top of list)
- Keyboard navigation (↑↓, Enter)
- Dismisses on Esc

---

## Design System

### Colors (Light Mode)
- **Background:** #FFFFFF
- **Panel divider:** #E0E0E0
- **Selected tree item:** #E3F2FD (blue 50)
- **Hover:** #F5F5F5
- **Error:** #F44336 (red 500)
- **Warning:** #FF9800 (orange 500)
- **Success:** #4CAF50 (green 500)
- **Text primary:** #212121
- **Text secondary:** #757575

### Colors (Dark Mode)
- **Background:** #1E1E1E
- **Panel divider:** #333333
- **Selected tree item:** #264F78 (blue dark)
- **Hover:** #2D2D2D
- **Error:** #F44336
- **Warning:** #FF9800
- **Success:** #4CAF50
- **Text primary:** #CCCCCC
- **Text secondary:** #888888

### Typography
- **Font family:** 'Inter', sans-serif
- **Headings:** 600 weight
- **Body:** 400 weight
- **Code:** 'Fira Mono', monospace

### Spacing
- **Unit:** 8px
- **Panel padding:** 16px
- **Form field spacing:** 12px
- **Tree indent:** 20px

### Icons
- Use **Lucide React** icons
- 20px size for tree icons
- 16px size for buttons

---

## Implementation Priorities

### Phase 1 (Milestone 2, Week 2)
1. **Three-panel layout** with resizable dividers
2. **Tree panel** with virtualization
3. **Basic editors** (component, service, context)
4. **Mock preview panel** (no renderer yet)

### Phase 2 (Milestone 2, Week 3)
5. **UIBlock tree editor** (form-based, no visual editor)
6. **Validation feedback** (real-time)
7. **Command palette**
8. **Keyboard shortcuts**

### Phase 3 (Milestone 3, Week 4)
9. **Live preview** (integrate UIBlockRenderer)
10. **Mock data editor**
11. **Error boundaries**

---

## Design Tools Recommendations

### Wireframing
- **Figma** - Industry standard, free tier available
- **Excalidraw** - Quick sketches

### Prototyping
- **Figma prototypes** - Interactive flows
- **CodeSandbox** - React prototype

### Design System
- **Storybook** - Component documentation
- **Figma design system** - Reusable components

---

## Validation with Plan Constraints

### ✅ Aligns with Plan
- **No visual drag-and-drop editor** - Uses form + tree only
- **Three-panel layout** - Matches Milestone 2 spec
- **Virtualized tree** - Handles 1000+ nodes
- **Real-time validation** - Zod validation on blur
- **Auto-save** - Debounced saves to IndexedDB

### ✅ Supports All Specs
- Component editor: props, state, UIBlocks
- Service editor: HTTP config, methods
- Context editor: shape
- Folder editor: name, description
- App editor: layout, routing, routes

### ✅ Preview Constraints
- Uses UIBlockRenderer (not runtime TSX)
- 9 primitives only
- Mock data provider
- Error boundaries

---

## Success Metrics

### After Milestone 2
- [ ] Tree displays 1000+ nodes without lag
- [ ] All spec types editable via forms
- [ ] Validation errors shown in real-time
- [ ] Changes auto-save within 500ms
- [ ] Keyboard navigation works
- [ ] Command palette functional

### After Milestone 3
- [ ] Preview updates within 1s of change
- [ ] Mock data customizable
- [ ] Error boundary catches preview crashes
- [ ] All 9 primitives render correctly

---

## Next Steps

1. **Create Figma mockups** (before Week 2)
   - High-fidelity designs for all panels
   - Interactive prototype for user testing

2. **Define component API** (Day 7)
   - TreePanel component props
   - EditorPanel component props
   - PreviewPanel component props

3. **Start Milestone 2 implementation** (Week 2)
   - Follow [milestone-2-builder.md](milestone-2-builder.md)
   - Reference this UX plan for design decisions

---

## Questions or Feedback?

- Check [plan.md](../plan.md) for architectural constraints
- Review [milestone-2-builder.md](milestone-2-builder.md) for implementation details
- Validate UX decisions don't conflict with spec-driven architecture

**Ready to build! 🎨**
