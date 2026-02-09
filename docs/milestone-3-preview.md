# Milestone 3: Preview

## Overview
Build the spec-driven preview renderer that displays UI from ComponentSpecJSON without executing generated TSX code. Includes error boundaries and mock data providers.

## Prerequisites
- Milestone 1 completed (Core & Persistence)
- Milestone 2 completed (Builder UI)

## Goals
- Create recursive UIBlock renderer
- Implement all 9 primitive components
- Add error boundaries for preview
- Provide mock data for props, services, and contexts
- Support component preview and app shell preview

---

## Tasks

### 1. Preview Primitives (src/preview/primitives/)

**Files to create:**

#### 1.1 `Stack.tsx` - Stack layout (row/column)
```typescript
export interface StackProps {
  direction: 'row' | 'column';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  children: React.ReactNode;
}

export function Stack({ direction, spacing = 0, align, justify, children }: StackProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: `${spacing * 8}px`, // 8px base unit
        alignItems: align,
        justifyContent: justify,
      }}
    >
      {children}
    </div>
  );
}
```

#### 1.2 `Card.tsx` - Card container
```typescript
export interface CardProps {
  padding?: number;
  elevation?: number;
  children: React.ReactNode;
}

export function Card({ padding = 2, elevation = 1, children }: CardProps) {
  return (
    <div
      style={{
        padding: `${padding * 8}px`,
        boxShadow: `0 ${elevation * 2}px ${elevation * 4}px rgba(0,0,0,0.1)`,
        borderRadius: '8px',
        backgroundColor: 'white',
      }}
    >
      {children}
    </div>
  );
}
```

#### 1.3 `Heading.tsx` - Heading (h1-h6)
```typescript
export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export function Heading({ level, text }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag>{text}</Tag>;
}
```

#### 1.4 `Text.tsx` - Text display
```typescript
export interface TextProps {
  content: string;
  variant?: 'body' | 'caption' | 'label';
  weight?: 'normal' | 'bold';
}

export function Text({ content, variant = 'body', weight = 'normal' }: TextProps) {
  return (
    <p
      style={{
        fontSize: variant === 'caption' ? '12px' : '14px',
        fontWeight: weight === 'bold' ? 700 : 400,
      }}
    >
      {content}
    </p>
  );
}
```

#### 1.5 `Button.tsx` - Button
```typescript
export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
  onClick?: string; // Handler name
  disabled?: boolean;
}

export function Button({ label, variant = 'primary', onClick, disabled }: ButtonProps) {
  return (
    <button
      className={`button button-${variant}`}
      onClick={() => console.log(`${onClick} triggered`)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

#### 1.6 `Input.tsx` - Text input
```typescript
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  onChange?: string; // Handler name
}

export function Input({ label, placeholder, value, type = 'text', onChange }: InputProps) {
  return (
    <div className="input-field">
      {label && <label>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => console.log(`${onChange} triggered with ${e.target.value}`)}
      />
    </div>
  );
}
```

#### 1.7 `Select.tsx` - Dropdown select
```typescript
export interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: string;
}

export function Select({ label, options, value, onChange }: SelectProps) {
  return (
    <div className="select-field">
      {label && <label>{label}</label>}
      <select value={value} onChange={(e) => console.log(`${onChange} triggered`)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### 1.8 `Table.tsx` - Data table
```typescript
export interface TableProps {
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, any>>;
}

export function Table({ columns, data }: TableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col.key}>{row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### 1.9 `Alert.tsx` - Alert/notification
```typescript
export interface AlertProps {
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}

export function Alert({ message, variant }: AlertProps) {
  return (
    <div className={`alert alert-${variant}`}>
      <AlertIcon variant={variant} />
      <span>{message}</span>
    </div>
  );
}
```

#### 1.10 `index.ts` - Barrel exports
```typescript
export * from './Stack';
export * from './Card';
export * from './Heading';
export * from './Text';
export * from './Button';
export * from './Input';
export * from './Select';
export * from './Table';
export * from './Alert';
```

**Acceptance Criteria:**
- [ ] All 9 primitives implemented
- [ ] Props match UIBlock spec
- [ ] Consistent styling
- [ ] Accessible (ARIA attributes)
- [ ] Responsive

---

### 2. UIBlock Renderer (src/preview/)

**Files to create:**

#### 2.1 `renderer.tsx` - Recursive UIBlock renderer
```typescript
export function UIBlockRenderer({ block, context }: Props) {
  // Resolve bindings (e.g., {user.name} → actual value from context)
  const resolvedProps = resolveBindings(block, context);

  switch (block.type) {
    case 'Stack':
      return (
        <Stack {...resolvedProps}>
          {block.children?.map((child, i) => (
            <UIBlockRenderer key={i} block={child} context={context} />
          ))}
        </Stack>
      );

    case 'Card':
      return (
        <Card {...resolvedProps}>
          {block.children?.map((child, i) => (
            <UIBlockRenderer key={i} block={child} context={context} />
          ))}
        </Card>
      );

    case 'Heading':
      return <Heading {...resolvedProps} />;

    case 'Text':
      return <Text {...resolvedProps} />;

    case 'Button':
      return <Button {...resolvedProps} />;

    case 'Input':
      return <Input {...resolvedProps} />;

    case 'Select':
      return <Select {...resolvedProps} />;

    case 'Table':
      return <Table {...resolvedProps} />;

    case 'Alert':
      return <Alert {...resolvedProps} />;

    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}
```

#### 2.2 `bindings.ts` - Resolve state bindings
```typescript
export function resolveBindings(block: UIBlock, context: RenderContext): any {
  const props = { ...block };

  // Resolve string interpolations like "{user.name}"
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value.match(/^\{.+\}$/)) {
      const path = value.slice(1, -1); // Remove { }
      props[key] = getValueByPath(context, path);
    }
  }

  return props;
}

export function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
```

#### 2.3 `types.ts` - Preview types
```typescript
export interface RenderContext {
  props: Record<string, any>;
  state: Record<string, any>;
  contexts: Record<string, any>;
  services: Record<string, any>;
}
```

**Acceptance Criteria:**
- [ ] Recursive rendering works
- [ ] State binding resolution correct
- [ ] Nested children render properly
- [ ] Unknown blocks logged as warnings
- [ ] Performance acceptable

---

### 3. Mock Provider (src/preview/)

**Files to create:**

#### 3.1 `mockProvider.tsx` - Mock data provider
```typescript
export function MockProvider({ instance, component, children }: Props) {
  const mockContext = useMemo(() => {
    return buildMockContext(instance, component);
  }, [instance, component]);

  return (
    <RenderContext.Provider value={mockContext}>
      {children}
    </RenderContext.Provider>
  );
}

function buildMockContext(instance: InstanceJSON, component: ComponentSpecJSON): RenderContext {
  return {
    props: instance.mocks.components[component.id]?.props || {},
    state: getInitialState(component.localState),
    contexts: getMockContexts(instance, component.consumesContexts),
    services: getMockServices(instance),
  };
}

function getInitialState(stateDefs?: StateDef[]): Record<string, any> {
  const state: Record<string, any> = {};
  stateDefs?.forEach((def) => {
    state[def.name] = def.initialValue;
  });
  return state;
}

function getMockContexts(instance: InstanceJSON, contextIds?: string[]): Record<string, any> {
  const contexts: Record<string, any> = {};
  contextIds?.forEach((id) => {
    const contextSpec = instance.contexts.find((c) => c.id === id);
    if (contextSpec) {
      contexts[contextSpec.name] = instance.mocks.contexts[id] || contextSpec.mockValue;
    }
  });
  return contexts;
}

function getMockServices(instance: InstanceJSON): Record<string, any> {
  // Return mock service implementations
  const services: Record<string, any> = {};
  instance.services.forEach((service) => {
    services[service.name] = createMockService(service, instance.mocks.services[service.id]);
  });
  return services;
}

function createMockService(spec: ServiceSpecJSON, mocks: any): any {
  const service: any = {};
  spec.methods.forEach((method) => {
    service[method.name] = async (...args: any[]) => {
      console.log(`Mock ${spec.name}.${method.name} called with`, args);
      return mocks?.[method.name] || null;
    };
  });
  return service;
}
```

**Acceptance Criteria:**
- [ ] Mock props provided
- [ ] Mock state initialized
- [ ] Mock contexts injected
- [ ] Mock services callable
- [ ] Console logs for debugging

---

### 4. Error Boundary (src/preview/)

**Files to create:**

#### 4.1 `errorBoundary.tsx` - Preview error boundary
```typescript
export class PreviewErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Preview error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="preview-error">
          <h3>Preview Error</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Reset Preview
          </button>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Acceptance Criteria:**
- [ ] Catches preview errors
- [ ] Shows error message
- [ ] Reset button works
- [ ] Stack trace available
- [ ] Doesn't crash entire app

---

### 5. Component Preview (src/app/components/Preview/)

**Files to create:**

#### 5.1 `ComponentPreview.tsx` - Preview single component
```typescript
export function ComponentPreview({ instance, component }: Props) {
  return (
    <div className="component-preview">
      <PreviewHeader component={component} />
      <PreviewErrorBoundary>
        <MockProvider instance={instance} component={component}>
          <div className="preview-canvas">
            {component.ui.map((block, i) => (
              <UIBlockRenderer key={i} block={block} context={getRenderContext()} />
            ))}
          </div>
        </MockProvider>
      </PreviewErrorBoundary>
      <PreviewFooter />
    </div>
  );
}
```

#### 5.2 `AppPreview.tsx` - Preview entire app
```typescript
export function AppPreview({ instance }: Props) {
  const [currentRoute, setCurrentRoute] = useState('/');

  return (
    <div className="app-preview">
      <PreviewHeader instance={instance} />
      <PreviewErrorBoundary>
        <MockProvider instance={instance} component={getRootComponent()}>
          <div className="preview-canvas">
            {/* Single source of truth: appSpec.layout */}
            {instance.appSpec.layout === 'routed' ? (
              <Router current={currentRoute} onChange={setCurrentRoute}>
                <AppRouter instance={instance} />
              </Router>
            ) : (
              <SinglePageApp instance={instance} />
            )}
          </div>
        </MockProvider>
      </PreviewErrorBoundary>
      <PreviewFooter />
    </div>
  );
}
```

#### 5.3 `PreviewHeader.tsx` - Preview toolbar
```typescript
export function PreviewHeader({ component }: Props) {
  return (
    <div className="preview-header">
      <h4>Preview: {component.name}</h4>
      <button onClick={handleRefresh}>Refresh</button>
      <button onClick={handleFullscreen}>Fullscreen</button>
    </div>
  );
}
```

#### 5.4 `PreviewFooter.tsx` - Preview info
```typescript
export function PreviewFooter() {
  return (
    <div className="preview-footer">
      <span>Using mock data</span>
      <span>UIBlocks: {blockCount}</span>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Component preview renders correctly
- [ ] App preview shows full app
- [ ] Routing works in preview (if enabled)
- [ ] Refresh updates preview
- [ ] Fullscreen mode available

---

### 6. Preview Panel Integration (src/app/pages/)

**Files to create:**

#### 6.1 `BuilderPageWithPreview.tsx` - Add preview panel
```typescript
export function BuilderPage() {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="builder-layout">
      <BuilderHeader />
      <div className="builder-content">
        <TreePanel />
        <EditorPanel />
        {showPreview && <PreviewPanel instance={instance} selectedNodeId={selectedNodeId} />}
      </div>
    </div>
  );
}
```

#### 6.2 `PreviewPanel.tsx` - Preview panel in builder
```typescript
export function PreviewPanel({ instance, selectedNodeId }: Props) {
  const component = getComponentById(instance, selectedNodeId);

  if (!component) {
    return (
      <div className="preview-panel">
        <EmptyState message="Select a component to preview" />
      </div>
    );
  }

  return (
    <div className="preview-panel">
      <ComponentPreview instance={instance} component={component} />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Preview panel shows in builder
- [ ] Updates when component selected
- [ ] Updates when spec changes (debounced 500ms)
- [ ] Can be hidden/shown
- [ ] Resizable panel

---

### 7. Preview Styling (src/preview/styles/)

**Files to create:**

#### 7.1 `preview.css` - Preview styles
```css
.preview-canvas {
  padding: 16px;
  background: #f5f5f5;
  min-height: 400px;
}

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.button-primary {
  background: #007bff;
  color: white;
}

.button-secondary {
  background: #6c757d;
  color: white;
}

.input-field input,
.select-field select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-info { background: #d1ecf1; color: #0c5460; }
.alert-success { background: #d4edda; color: #155724; }
.alert-warning { background: #fff3cd; color: #856404; }
.alert-error { background: #f8d7da; color: #721c24; }
```

**Acceptance Criteria:**
- [ ] Consistent styling across primitives
- [ ] Responsive
- [ ] Accessible contrast ratios
- [ ] Matches Material Design or similar

---

## Testing Strategy

### Unit Tests
- [ ] Each primitive component
- [ ] Binding resolution
- [ ] Mock provider

### Component Tests
- [ ] UIBlock renderer with nested blocks
- [ ] Error boundary catches errors
- [ ] Preview updates on spec change

### Integration Tests
- [ ] Full component preview
- [ ] App preview with routing
- [ ] Mock data flows correctly

---

## Definition of Done

- [ ] All 9 primitives implemented and styled
- [ ] Recursive UIBlock rendering works
- [ ] State binding resolution correct
- [ ] Mock provider supplies data
- [ ] Error boundary prevents crashes
- [ ] Component preview functional
- [ ] App preview functional (single-page and routed)
- [ ] Preview updates on spec changes (debounced)
- [ ] Preview panel integrated in builder
- [ ] All tests passing
- [ ] Styling polished
- [ ] Documentation updated

---

## Estimated Effort
- Primitives: 12 hours
- UIBlock renderer: 8 hours
- Binding resolution: 6 hours
- Mock provider: 8 hours
- Error boundary: 4 hours
- Component preview: 6 hours
- App preview: 8 hours
- Preview panel integration: 4 hours
- Styling: 6 hours
- Testing: 8 hours

**Total: ~70 hours (1.5 weeks)**
