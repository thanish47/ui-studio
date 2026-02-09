# Milestone 2: Builder UI

## Overview
Build the interactive builder interface where users create and edit their application specs using a tree editor, spec editors, and mock data editor.

## Prerequisites
- Milestone 1 completed (Core & Persistence)

## Goals
- Create tree editor with virtualization for performance
- Build spec editors for app, components, services, and contexts
- Implement mock data editor
- Add validation feedback UI
- Create navigation and layout

---

## Tasks

### 1. Graph/Tree Utilities (src/core/graph/)

**Files to create:**

#### 1.1 `tree.ts` - Tree data structure
```typescript
export interface TreeNode {
  id: string;
  type: 'folder' | 'component' | 'service' | 'context';
  name: string;
  parentId: string | null;
  children: string[]; // IDs of children
  spec: FolderSpecJSON | ComponentSpecJSON | ServiceSpecJSON | ContextSpec;
}

export class Tree {
  private nodes: Map<string, TreeNode>;
  private rootId: string;

  constructor(instance: InstanceJSON) {
    this.buildTree(instance);
  }

  getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(id: string): TreeNode[] {
    const node = this.nodes.get(id);
    return node ? node.children.map(childId => this.nodes.get(childId)!).filter(Boolean) : [];
  }

  getParent(id: string): TreeNode | undefined {
    const node = this.nodes.get(id);
    return node?.parentId ? this.nodes.get(node.parentId) : undefined;
  }

  getPath(id: string): TreeNode[] {
    const path: TreeNode[] = [];
    let current = this.nodes.get(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return path;
  }

  getDepth(id: string): number {
    return this.getPath(id).length - 1;
  }

  validateDepth(): boolean {
    // Max depth = 10 levels
    for (const [id] of this.nodes) {
      if (this.getDepth(id) > 10) {
        return false;
      }
    }
    return true;
  }

  private buildTree(instance: InstanceJSON): void {
    // Build tree from instance
  }
}
```

#### 1.2 `operations.ts` - Tree manipulation operations
```typescript
export function addNode(tree: Tree, parentId: string, node: TreeNode): Tree {
  // Add node to tree
}

export function removeNode(tree: Tree, id: string): Tree {
  // Remove node and all descendants
}

export function moveNode(tree: Tree, id: string, newParentId: string): Tree {
  // Move node to new parent
}

export function renameNode(tree: Tree, id: string, newName: string): Tree {
  // Rename node
}
```

**Acceptance Criteria:**
- [ ] Tree structure correctly represents instance hierarchy
- [ ] All tree operations work (add, remove, move, rename)
- [ ] Depth validation enforced
- [ ] Cycle detection works
- [ ] Path calculation correct

---

### 2. Builder Layout (src/app/pages/)

**Files to create:**

#### 2.1 `BuilderPage.tsx` - Main builder layout
```typescript
export function BuilderPage() {
  const { instanceId } = useParams();
  const [instance, setInstance] = useState<InstanceJSON | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="builder-layout">
      <BuilderHeader instance={instance} />
      <div className="builder-content">
        <TreePanel
          instance={instance}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
        <EditorPanel
          instance={instance}
          selectedNodeId={selectedNodeId}
          onUpdate={handleUpdate}
        />
        <PropertiesPanel
          instance={instance}
          selectedNodeId={selectedNodeId}
        />
      </div>
    </div>
  );
}
```

#### 2.2 `BuilderHeader.tsx` - Header with save/export buttons
```typescript
export function BuilderHeader({ instance }: Props) {
  return (
    <header>
      <h1>{instance.name}</h1>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleExport}>Export</button>
      <button onClick={handlePreview}>Preview</button>
    </header>
  );
}
```

**Acceptance Criteria:**
- [ ] Three-panel layout (tree, editor, properties)
- [ ] Responsive design
- [ ] Header with actions
- [ ] Navigation breadcrumbs
- [ ] Loading states

---

### 3. Tree Editor (src/app/components/TreeEditor/)

**Files to create:**

#### 3.1 `TreePanel.tsx` - Main tree panel
```typescript
import { FixedSizeTree } from 'react-vtree';

export function TreePanel({ instance, selectedNodeId, onSelectNode }: Props) {
  const tree = useMemo(() => new Tree(instance), [instance]);

  return (
    <div className="tree-panel">
      <TreeToolbar onAdd={handleAdd} onDelete={handleDelete} />
      <VirtualizedTree
        tree={tree}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
      />
    </div>
  );
}
```

#### 3.2 `VirtualizedTree.tsx` - Virtualized tree component
```typescript
export function VirtualizedTree({ tree, selectedNodeId, onSelectNode }: Props) {
  // Use react-window or react-vtree for virtualization
  // Handle 1000+ nodes efficiently
  // Show expand/collapse icons
  // Drag and drop support
}
```

#### 3.3 `TreeNode.tsx` - Single tree node component
```typescript
export function TreeNode({ node, isSelected, onSelect, onExpand }: Props) {
  return (
    <div
      className={`tree-node ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(node.id)}
    >
      <NodeIcon type={node.type} />
      <span>{node.name}</span>
      {node.children.length > 0 && <ExpandIcon />}
    </div>
  );
}
```

#### 3.4 `TreeToolbar.tsx` - Tree actions toolbar
```typescript
export function TreeToolbar({ onAdd, onDelete, onMove }: Props) {
  return (
    <div className="tree-toolbar">
      <button onClick={() => onAdd('folder')}>Add Folder</button>
      <button onClick={() => onAdd('component')}>Add Component</button>
      <button onClick={() => onAdd('service')}>Add Service</button>
      <button onClick={() => onAdd('context')}>Add Context</button>
      <button onClick={onDelete} disabled={!selectedNode}>Delete</button>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tree displays entire hierarchy
- [ ] Virtualization works for 1000+ nodes
- [ ] Select node highlights it
- [ ] Expand/collapse folders
- [ ] Add/delete operations work
- [ ] Drag and drop to reorder (optional)
- [ ] Keyboard navigation

---

### 4. Spec Editors (src/app/components/SpecEditors/)

**Files to create:**

#### 4.1 `EditorPanel.tsx` - Router for different editors
```typescript
export function EditorPanel({ instance, selectedNodeId, onUpdate }: Props) {
  const node = selectedNodeId ? getNodeById(instance, selectedNodeId) : null;

  if (!node) {
    return <EmptyState message="Select a node to edit" />;
  }

  switch (node.type) {
    case 'component':
      return <ComponentEditor spec={node.spec} onUpdate={onUpdate} />;
    case 'service':
      return <ServiceEditor spec={node.spec} onUpdate={onUpdate} />;
    case 'context':
      return <ContextEditor spec={node.spec} onUpdate={onUpdate} />;
    case 'folder':
      return <FolderEditor spec={node.spec} onUpdate={onUpdate} />;
    default:
      return null;
  }
}
```

#### 4.2 `ComponentEditor.tsx` - Component spec editor
```typescript
export function ComponentEditor({ spec, onUpdate }: Props) {
  const [localSpec, setLocalSpec] = useState(spec);

  return (
    <div className="component-editor">
      <section>
        <h3>Basic Info</h3>
        <input
          type="text"
          value={localSpec.name}
          onChange={(e) => updateField('name', e.target.value)}
        />
      </section>

      <section>
        <h3>Props</h3>
        <PropsEditor props={localSpec.props} onChange={updateProps} />
      </section>

      <section>
        <h3>State</h3>
        <StateEditor state={localSpec.localState} onChange={updateState} />
      </section>

      <section>
        <h3>Events</h3>
        <EventsEditor events={localSpec.events} onChange={updateEvents} />
      </section>

      <section>
        <h3>Contexts</h3>
        <ContextSelector
          selected={localSpec.consumesContexts}
          available={getAvailableContexts()}
          onChange={updateContexts}
        />
      </section>

      <section>
        <h3>UI Layout</h3>
        <UIBlockEditor blocks={localSpec.ui} onChange={updateUI} />
      </section>

      <section>
        <h3>Test Level</h3>
        <select value={localSpec.testLevel} onChange={updateTestLevel}>
          <option value="none">None</option>
          <option value="smoke">Smoke</option>
          <option value="full">Full</option>
        </select>
      </section>
    </div>
  );
}
```

#### 4.3 `ServiceEditor.tsx` - Service spec editor
```typescript
export function ServiceEditor({ spec, onUpdate }: Props) {
  return (
    <div className="service-editor">
      <section>
        <h3>Service Name</h3>
        <input type="text" value={spec.name} onChange={handleNameChange} />
      </section>

      <section>
        <h3>Methods</h3>
        <MethodsEditor methods={spec.methods} onChange={updateMethods} />
      </section>

      <section>
        <h3>HTTP Configuration</h3>
        <HTTPConfigEditor config={spec.http} onChange={updateHTTP} />
      </section>
    </div>
  );
}
```

#### 4.4 `ContextEditor.tsx` - Context spec editor
```typescript
export function ContextEditor({ spec, onUpdate }: Props) {
  return (
    <div className="context-editor">
      <section>
        <h3>Context Name</h3>
        <input type="text" value={spec.name} onChange={handleNameChange} />
      </section>

      <section>
        <h3>Shape Definition</h3>
        <ShapeEditor shape={spec.shape} onChange={updateShape} />
      </section>

      <section>
        <h3>Default Value</h3>
        <JSONEditor value={spec.defaultValue} onChange={updateDefault} />
      </section>

      <section>
        <h3>Mock Value (for preview)</h3>
        <JSONEditor value={spec.mockValue} onChange={updateMock} />
      </section>
    </div>
  );
}
```

#### 4.5 `FolderEditor.tsx` - Folder spec editor
#### 4.6 `AppEditor.tsx` - App-level settings editor

**Sub-components:**
- `PropsEditor.tsx` - Edit component props
- `StateEditor.tsx` - Edit local state
- `EventsEditor.tsx` - Edit event handlers
- `MethodsEditor.tsx` - Edit service methods
- `UIBlockEditor.tsx` - Edit UI layout (visual builder for UIBlocks)
- `ShapeEditor.tsx` - Edit TypeScript types
- `JSONEditor.tsx` - JSON editor with syntax highlighting

**Acceptance Criteria:**
- [ ] Each spec type has dedicated editor
- [ ] Form validation works
- [ ] Changes saved on blur or button click
- [ ] Undo/redo support (optional)
- [ ] Error messages display inline
- [ ] Auto-save drafts

---

### 5. UIBlock Editor (src/app/components/UIBlockEditor/)

**Files to create:**

#### 5.1 `UIBlockEditor.tsx` - Visual UIBlock editor
```typescript
export function UIBlockEditor({ blocks, onChange }: Props) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  return (
    <div className="uiblock-editor">
      <BlockTree blocks={blocks} onSelect={setSelectedBlockId} />
      <BlockPropertiesEditor
        block={getBlockById(blocks, selectedBlockId)}
        onChange={updateBlock}
      />
      <BlockToolbar onAdd={addBlock} onDelete={deleteBlock} />
    </div>
  );
}
```

#### 5.2 `BlockTree.tsx` - Tree view of UIBlocks
#### 5.3 `BlockPropertiesEditor.tsx` - Edit block properties
#### 5.4 `BlockToolbar.tsx` - Add/delete blocks

**Supported UIBlocks:**
- Stack (row/column)
- Card
- Heading
- Text
- Button
- Input
- Select
- Table
- Alert

**Acceptance Criteria:**
- [ ] Visual tree of UIBlocks
- [ ] Add/remove blocks
- [ ] Edit block properties (text, styling, bindings)
- [ ] Validate state bindings
- [ ] Drag to reorder (optional)

---

### 6. Mock Data Editor (src/app/components/MockEditor/)

**Files to create:**

#### 6.1 `MockDataEditor.tsx` - Main mock editor
```typescript
export function MockDataEditor({ instance, onChange }: Props) {
  return (
    <div className="mock-editor">
      <h3>Mock Data</h3>
      <Tabs>
        <Tab label="Component Mocks">
          <ComponentMocksEditor
            components={instance.components}
            mocks={instance.mocks.components}
            onChange={updateComponentMocks}
          />
        </Tab>
        <Tab label="Service Mocks">
          <ServiceMocksEditor
            services={instance.services}
            mocks={instance.mocks.services}
            onChange={updateServiceMocks}
          />
        </Tab>
        <Tab label="Context Mocks">
          <ContextMocksEditor
            contexts={instance.contexts}
            mocks={instance.mocks.contexts}
            onChange={updateContextMocks}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
```

#### 6.2 `ComponentMocksEditor.tsx` - Mock props for components
#### 6.3 `ServiceMocksEditor.tsx` - Mock responses for services
#### 6.4 `ContextMocksEditor.tsx` - Mock values for contexts

**Acceptance Criteria:**
- [ ] Edit mock data for all components
- [ ] Edit mock responses for services
- [ ] Edit mock values for contexts
- [ ] JSON validation
- [ ] Preview with mocks

---

### 7. Validation Feedback UI (src/app/components/Validation/)

**Files to create:**

#### 7.1 `ValidationPanel.tsx` - Display validation errors
```typescript
export function ValidationPanel({ instance }: Props) {
  const errors = useMemo(() => {
    return [
      ...validateNamingConventions(instance),
      ...validateReferences(instance),
      ...validatePerformanceLimits(instance),
    ];
  }, [instance]);

  if (errors.length === 0) {
    return <div className="validation-success">✓ No validation errors</div>;
  }

  return (
    <div className="validation-errors">
      <h3>Validation Errors ({errors.length})</h3>
      {errors.map((error, i) => (
        <ValidationError key={i} error={error} />
      ))}
    </div>
  );
}
```

#### 7.2 `ValidationError.tsx` - Single error display
```typescript
export function ValidationError({ error }: Props) {
  return (
    <div className={`validation-error ${error.type.toLowerCase()}`}>
      <ErrorIcon type={error.type} />
      <div>
        <strong>{error.type}</strong>
        <p>{error.message}</p>
        {error.path && <code>{error.path}</code>}
      </div>
      {error.fix && <button onClick={error.fix}>Fix</button>}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Real-time validation
- [ ] Errors grouped by type
- [ ] Click error to navigate to issue
- [ ] Suggested fixes when possible
- [ ] Export blocked when errors exist

---

### 8. Custom Hooks (src/app/hooks/)

**Files to create:**

#### 8.1 `useInstance.ts` - Load and manage instance
```typescript
export function useInstance(instanceId: string) {
  const [instance, setInstance] = useState<InstanceJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadInstance();
  }, [instanceId]);

  async function loadInstance() {
    try {
      const db = await initDatabase();
      const repo = new InstanceRepository(db);
      const loaded = await repo.getById(instanceId);

      if (!loaded) {
        throw new Error('Instance not found');
      }

      // Apply migrations
      const migrated = migrateInstance(loaded);
      setInstance(migrated);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function updateInstance(updater: (instance: InstanceJSON) => InstanceJSON) {
    if (!instance) return;

    const updated = updater(instance);
    setInstance(updated);

    const db = await initDatabase();
    const repo = new InstanceRepository(db);
    await repo.update(updated);
  }

  return { instance, loading, error, updateInstance };
}
```

#### 8.2 `useLock.ts` - Manage instance lock
```typescript
export function useLock(instanceId: string) {
  const [hasLock, setHasLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const lockManager = useMemo(() => new LockManager(), []);

  useEffect(() => {
    acquireLock();
    return () => {
      lockManager.releaseLock(instanceId);
    };
  }, [instanceId]);

  async function acquireLock() {
    const acquired = await lockManager.acquireLock(instanceId);
    if (acquired) {
      setHasLock(true);
    } else {
      setLockError('This instance is already open in another tab');
    }
  }

  return { hasLock, lockError };
}
```

#### 8.3 `useTree.ts` - Manage tree state
#### 8.4 `useValidation.ts` - Real-time validation

**Acceptance Criteria:**
- [ ] Hooks are reusable
- [ ] Proper cleanup on unmount
- [ ] Error handling
- [ ] TypeScript types

---

## Testing Strategy

### Unit Tests
- [ ] Tree operations
- [ ] Validation logic
- [ ] Mock data handling

### Component Tests
- [ ] Tree editor interactions
- [ ] Spec editor form validation
- [ ] Mock editor updates

### Integration Tests
- [ ] Full edit workflow
- [ ] Save and reload
- [ ] Validation feedback

---

## Definition of Done

- [ ] Tree editor displays full hierarchy
- [ ] Virtualization handles 1000+ nodes
- [ ] All spec editors functional
- [ ] UIBlock editor allows visual editing
- [ ] Mock data editor works
- [ ] Real-time validation feedback
- [ ] Changes auto-saved
- [ ] Lock prevents concurrent edits
- [ ] All tests passing
- [ ] Responsive UI
- [ ] Documentation updated

---

## Estimated Effort
- Tree utilities: 8 hours
- Builder layout: 4 hours
- Tree editor: 12 hours
- Spec editors: 20 hours
- UIBlock editor: 10 hours
- Mock editor: 8 hours
- Validation UI: 6 hours
- Custom hooks: 6 hours
- Testing: 10 hours

**Total: ~84 hours (2 weeks)**
