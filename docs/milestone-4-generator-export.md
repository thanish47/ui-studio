# Milestone 4: Generator & Export

## Overview
Implement the code generator that converts InstanceJSON to a production-ready React application with full test coverage. Includes file tree generation, template rendering, Prettier formatting, and ZIP export.

## Prerequisites
- Milestone 1 completed (Core & Persistence)
- Milestone 2 completed (Builder UI)
- Milestone 3 completed (Preview)

## Goals
- Generate deterministic file tree from InstanceJSON
- Create all component, service, and context files
- Generate tests for all components
- Create config files (Vite, TypeScript, Vitest)
- Format all generated code with Prettier
- Export as downloadable ZIP file

---

## Tasks

### 1. File Tree Generator (src/generator/)

**Files to create:**

#### 1.1 `fileTree.ts` - Main file tree generator
```typescript
export async function generateFileTree(instance: InstanceJSON): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  // Validate instance first - returns array of errors
  const errors = validateForExport(instance);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
  }

  // Generate package.json
  files['package.json'] = generatePackageJson(instance);

  // Generate config files
  files['vite.config.ts'] = generateViteConfig();
  files['tsconfig.json'] = generateTsConfig();
  files['vitest.config.ts'] = generateVitestConfig();
  files['.eslintrc.json'] = generateEslintConfig();
  files['.prettierrc'] = generatePrettierConfig();

  // Generate index.html
  files['index.html'] = generateIndexHtml(instance);

  // Generate main.tsx
  files['src/main.tsx'] = generateMain(instance);

  // Generate App component
  files['src/app/App.tsx'] = generateAppComponent(instance);
  files['src/app/app.spec.tsx'] = generateAppTest(instance);

  // Generate contexts
  instance.contexts.forEach((context) => {
    const contextFiles = generateContext(context);
    Object.assign(files, contextFiles);
  });

  // Generate contexts barrel export
  if (instance.contexts.length > 0) {
    files['src/contexts/index.ts'] = generateContextsBarrel(instance.contexts);
  }

  // Generate folders and components (respecting tree structure)
  instance.folders.forEach((folder) => {
    const folderFiles = generateFolder(folder, instance);
    Object.assign(files, folderFiles);
  });

  // Generate components (organize by parent folder)
  instance.components.forEach((component) => {
    const componentFiles = generateComponent(component, instance);
    Object.assign(files, componentFiles);
  });

  // Generate top-level components barrel export
  files['src/components/index.ts'] = generateComponentsBarrel(instance.components.filter(c => !c.parentId));

  // Generate services
  instance.services.forEach((service) => {
    const serviceFiles = generateService(service);
    Object.assign(files, serviceFiles);
  });

  // Generate services barrel export
  if (instance.services.length > 0) {
    files['src/services/index.ts'] = generateServicesBarrel(instance.services);
  }

  // Format all TypeScript/TSX files with Prettier (async in v3)
  return await formatFiles(files);
}
```

#### 1.2 `validator.ts` - Pre-export validation
```typescript
export function validateForExport(instance: InstanceJSON): ValidationError[] {
  // Collect all validation errors
  return [
    ...validateNamingConventions(instance),
    ...validateReferences(instance),
    ...validatePerformanceLimits(instance),
    ...validateRoutingConfig(instance),
  ];
}

export interface ValidationError {
  type: 'VALIDATION_ERROR' | 'PERFORMANCE' | 'REFERENCE' | 'NAMING';
  message: string;
  path?: string;
  fix?: () => void;
}
```

**Acceptance Criteria:**
- [ ] Validation blocks invalid exports
- [ ] All files generated deterministically
- [ ] No duplicates or conflicts
- [ ] File paths follow conventions

---

### 2. Config File Generators (src/generator/config/)

**Files to create:**

#### 2.1 `packageJson.ts`
```typescript
export function generatePackageJson(instance: InstanceJSON): string {
  const pkg = {
    name: instance.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      test: 'vitest',
      preview: 'vite preview',
      lint: 'eslint src --ext ts,tsx',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      '@vitejs/plugin-react': '^4.2.0',
      '@testing-library/react': '^14.0.0',
      '@testing-library/jest-dom': '^6.1.0',
      vitest: '^1.0.0',
      typescript: '^5.3.0',
      vite: '^5.0.0',
      eslint: '^8.56.0',
      'eslint-plugin-react': '^7.33.2',
    },
  };

  // Add react-router if routing enabled (check layout field)
  if (instance.appSpec.layout === 'routed') {
    pkg.dependencies['react-router-dom'] = '^6.20.0';
    pkg.devDependencies['@types/react-router-dom'] = '^5.3.3';
  }

  // Add axios if any service uses HTTP
  const hasHttpServices = instance.services.some(s => s.http);
  if (hasHttpServices) {
    pkg.dependencies['axios'] = '^1.6.0';
  }

  return JSON.stringify(pkg, null, 2);
}
```

#### 2.2 `viteConfig.ts`
```typescript
export function generateViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
`;
}
```

#### 2.3 `tsConfig.ts`
#### 2.4 `vitestConfig.ts`
#### 2.5 `eslintConfig.ts`
#### 2.6 `prettierConfig.ts`

**Acceptance Criteria:**
- [ ] Configs are valid
- [ ] Dependencies correct
- [ ] Routing dependencies conditional
- [ ] Generated app runs with npm install

---

### 3. Folder & Component Generator (src/generator/components/)

**Files to create:**

#### 3.1 `folderGenerator.ts` - Generate folder structure
```typescript
export function generateFolder(
  spec: FolderSpecJSON,
  instance: InstanceJSON
): Record<string, string> {
  const files: Record<string, string> = {};
  const folderPath = `src/features/${spec.name}`;

  // Generate barrel export if enabled
  if (spec.barrelExport) {
    const componentsInFolder = instance.components.filter(c => c.parentId === spec.id);
    files[`${folderPath}/index.ts`] = generateFolderBarrel(componentsInFolder);
  }

  // Generate folder-level test if enabled
  if (spec.hasTest) {
    files[`${folderPath}/${spec.name}.spec.tsx`] = generateFolderTest(spec, instance);
  }

  return files;
}

function generateFolderBarrel(components: ComponentSpecJSON[]): string {
  const exports = components.map(c => `export * from './components/${c.name}';`).join('\n');
  return exports || '// No exports';
}

function generateFolderTest(spec: FolderSpecJSON, instance: InstanceJSON): string {
  const entryComponent = instance.components.find(c => c.parentId === spec.id);
  if (!entryComponent) return '';

  return `import { render } from '@testing-library/react';
import { ${entryComponent.name} } from './components/${entryComponent.name}';

describe('${spec.name} feature', () => {
  it('renders entry component', () => {
    render(<${entryComponent.name} />);
  });
});
`;
}
```

#### 3.2 `componentGenerator.ts`
```typescript
export function generateComponent(
  spec: ComponentSpecJSON,
  instance: InstanceJSON
): Record<string, string> {
  const files: Record<string, string> = {};

  // Determine the correct path based on parent folder
  const basePath = getComponentPath(spec, instance);

  // Generate component file
  files[`${basePath}/${spec.name}.tsx`] = generateComponentFile(spec, instance);

  // Generate test file (if testLevel !== "none")
  if (spec.testLevel !== 'none') {
    files[`${basePath}/${spec.name}.spec.tsx`] = generateComponentTest(spec);
  }

  return files;
}

function getComponentPath(spec: ComponentSpecJSON, instance: InstanceJSON): string {
  // If component has a parent folder, use features/<folder>/components
  if (spec.parentId) {
    const folder = instance.folders.find(f => f.id === spec.parentId);
    if (folder) {
      return `src/features/${folder.name}/components`;
    }
  }
  // Otherwise, use top-level components folder
  return 'src/components';
}

function generateComponentFile(spec: ComponentSpecJSON, instance: InstanceJSON): string {
  const imports = generateImports(spec, instance);
  const propsInterface = generatePropsInterface(spec);
  const componentBody = generateComponentBody(spec);

  return `${imports}

${propsInterface}

export function ${spec.name}(${spec.props.length > 0 ? `props: ${spec.name}Props` : ''}) {
  ${generateStateHooks(spec.localState)}
  ${generateContextConsumption(spec.consumesContexts, instance)}

  ${generateEventHandlers(spec.events)}

  return (
    ${generateJSX(spec.ui)}
  );
}
`;
}

function generateImports(spec: ComponentSpecJSON, instance: InstanceJSON): string {
  const imports: string[] = ["import React from 'react';"];

  // Add state hook if needed
  if (spec.localState && spec.localState.length > 0) {
    imports.push("import { useState } from 'react';");
  }

  // Calculate relative path to contexts based on component location
  const contextPath = spec.parentId
    ? '../../../contexts'  // from src/features/{folder}/components
    : '../contexts';       // from src/components

  // Add context imports with correct relative path
  if (spec.consumesContexts && spec.consumesContexts.length > 0) {
    spec.consumesContexts.forEach((contextId) => {
      const context = instance.contexts.find((c) => c.id === contextId);
      if (context) {
        imports.push(`import { ${context.name} } from '${contextPath}/${context.name}';`);
        imports.push("import { useContext } from 'react';");
      }
    });
  }

  return imports.join('\n');
}

function generatePropsInterface(spec: ComponentSpecJSON): string {
  if (spec.props.length === 0) {
    return `interface ${spec.name}Props {}`;
  }

  const propLines = spec.props.map((prop) => {
    const optional = !prop.required ? '?' : '';
    return `  ${prop.name}${optional}: ${prop.type};`;
  });

  return `interface ${spec.name}Props {\n${propLines.join('\n')}\n}`;
}

function generateStateHooks(stateDefs?: StateDef[]): string {
  if (!stateDefs || stateDefs.length === 0) return '';

  return stateDefs
    .map((state) => {
      const initialValue = JSON.stringify(state.initialValue);
      return `  const [${state.name}, set${capitalize(state.name)}] = useState<${state.type}>(${initialValue});`;
    })
    .join('\n');
}

function generateContextConsumption(contextIds?: string[], instance?: InstanceJSON): string {
  if (!contextIds || contextIds.length === 0 || !instance) return '';

  return contextIds
    .map((id) => {
      const context = instance.contexts.find((c) => c.id === id);
      if (!context) return '';
      return `  const ${context.name.replace('Context', '').toLowerCase()} = useContext(${context.name});`;
    })
    .join('\n');
}

function generateEventHandlers(events?: EventDef[]): string {
  if (!events || events.length === 0) return '';

  return events
    .map((event) => {
      const params = event.params?.join(', ') || '';
      return `  function ${event.handler}(${params}) {\n    console.log('${event.handler} called');\n  }`;
    })
    .join('\n\n');
}

function generateJSX(blocks: UIBlock[]): string {
  return blocks.map((block) => generateBlockJSX(block)).join('\n    ');
}

function generateBlockJSX(block: UIBlock): string {
  switch (block.type) {
    case 'Stack':
      return `<div style={{ display: 'flex', flexDirection: '${block.direction}', gap: '${(block.spacing || 0) * 8}px' }}>
      ${block.children?.map(generateBlockJSX).join('\n      ')}
    </div>`;

    case 'Card':
      return `<div style={{ padding: '${(block.padding || 2) * 8}px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      ${block.children?.map(generateBlockJSX).join('\n      ')}
    </div>`;

    case 'Heading':
      return `<h${block.level}>${block.text}</h${block.level}>`;

    case 'Text':
      return `<p>${block.content}</p>`;

    case 'Button':
      return `<button onClick={${block.onClick || '() => {}'}>${block.label}</button>`;

    case 'Input':
      return `<input type="${block.type || 'text'}" placeholder="${block.placeholder || ''}" />`;

    case 'Select':
      return `<select>
      ${block.options?.map((opt: any) => `<option value="${opt.value}">${opt.label}</option>`).join('\n      ')}
    </select>`;

    case 'Table':
      return `<table>
      <thead><tr>${block.columns?.map((col: any) => `<th>${col.label}</th>`).join('')}</tr></thead>
      <tbody>{/* Table rows */}</tbody>
    </table>`;

    case 'Alert':
      return `<div className="alert alert-${block.variant}">${block.message}</div>`;

    default:
      return `{/* Unknown block type: ${block.type} */}`;
  }
}
```

#### 3.2 `componentTestGenerator.ts`
```typescript
export function generateComponentTest(spec: ComponentSpecJSON): string {
  const testLevel = spec.testLevel || 'smoke';

  if (testLevel === 'smoke') {
    return generateSmokeTest(spec);
  } else {
    return generateFullTest(spec);
  }
}

function generateSmokeTest(spec: ComponentSpecJSON): string {
  const requiredProps = spec.props
    .filter((p) => p.required)
    .map((p) => `${p.name}={${JSON.stringify(p.defaultValue || getDefaultValueForType(p.type))}}`)
    .join(' ');

  return `import { render, screen } from '@testing-library/react';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  it('renders without crashing', () => {
    render(<${spec.name} ${requiredProps} />);
  });
});
`;
}

function getDefaultValueForType(type: string): any {
  if (type.includes('string')) return '';
  if (type.includes('number')) return 0;
  if (type.includes('boolean')) return false;
  if (type.includes('[]')) return [];
  return null;
}

function generateFullTest(spec: ComponentSpecJSON): string {
  const requiredProps = spec.props
    .filter((p) => p.required)
    .map((p) => `${p.name}={${JSON.stringify(p.defaultValue || getDefaultValueForType(p.type))}}`)
    .join(' ');

  // Generate more comprehensive tests including interaction tests
  return `import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  it('renders without crashing', () => {
    render(<${spec.name} ${requiredProps} />);
  });

  ${spec.events
    ?.map(
      (event) => `
  it('handles ${event.handler}', () => {
    const ${event.handler} = vi.fn();
    render(<${spec.name} ${event.name}={${event.handler}} ${requiredProps} />);
    // Trigger event and assert
  });`
    )
    .join('\n')}
});
`;
}
```

**Acceptance Criteria:**
- [ ] Components generated with correct syntax
- [ ] Props interface correct
- [ ] State hooks initialized
- [ ] Context consumption works
- [ ] Event handlers stubbed
- [ ] JSX renders UIBlocks correctly
- [ ] Tests generated based on testLevel

---

### 4. Service Generator (src/generator/services/)

**Files to create:**

#### 4.1 `serviceGenerator.ts`
```typescript
export function generateService(spec: ServiceSpecJSON): Record<string, string> {
  const files: Record<string, string> = {};

  files[`src/services/${spec.name}.ts`] = generateServiceFile(spec);
  files[`src/services/${spec.name}.spec.ts`] = generateServiceTest(spec);

  return files;
}

function generateServiceFile(spec: ServiceSpecJSON): string {
  const methods = spec.methods.map((method) => generateMethod(method, spec.http)).join('\n\n');

  return `${spec.http ? "import axios from 'axios';\n\n" : ''}export const ${spec.name} = {
${methods}
};
`;
}

function generateMethod(method: MethodDef, httpConfig?: any): string {
  const params = method.params.map((p) => `${p.name}: ${p.type}`).join(', ');
  const asyncKeyword = method.async ? 'async ' : '';

  if (method.http && httpConfig) {
    const { method: httpMethod, endpoint } = method.http;
    const url = `${httpConfig.baseUrl}${endpoint}`;

    return `  ${method.name}: ${asyncKeyword}(${params}): Promise<${method.returnType}> => {
    const response = await axios.${httpMethod.toLowerCase()}('${url}');
    return response.data;
  },`;
  } else {
    return `  ${method.name}: ${asyncKeyword}(${params}): ${method.async ? `Promise<${method.returnType}>` : method.returnType} => {
    // TODO: Implement ${method.name}
    throw new Error('Not implemented');
  },`;
  }
}
```

#### 4.2 `serviceTestGenerator.ts`
```typescript
export function generateServiceTest(spec: ServiceSpecJSON): string {
  return `import { describe, it, expect } from 'vitest';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  ${spec.methods
    .map(
      (method) => `
  it('${method.name} works', async () => {
    // TODO: Implement test for ${method.name}
    expect(${spec.name}.${method.name}).toBeDefined();
  });`
    )
    .join('\n')}
});
`;
}
```

**Acceptance Criteria:**
- [ ] Service files generated
- [ ] HTTP methods use axios
- [ ] Non-HTTP methods stubbed
- [ ] Service tests generated
- [ ] TypeScript types correct

---

### 5. Context Generator (src/generator/contexts/)

**Files to create:**

#### 5.1 `contextGenerator.ts`
```typescript
export function generateContext(spec: ContextSpec): Record<string, string> {
  const files: Record<string, string> = {};

  files[`src/contexts/${spec.name}.tsx`] = generateContextFile(spec);

  return files;
}

function generateContextFile(spec: ContextSpec): string {
  const typeInterface = generateContextTypeInterface(spec);
  const contextCreation = generateContextCreation(spec);
  const providerComponent = generateProviderComponent(spec);

  return `import React, { createContext, useState, ReactNode } from 'react';

${typeInterface}

${contextCreation}

${providerComponent}
`;
}

function generateContextTypeInterface(spec: ContextSpec): string {
  const fields = Object.entries(spec.shape)
    .map(([key, typeDef]) => {
      const optional = typeDef.optional ? '?' : '';
      return `  ${key}${optional}: ${typeDef.type};`;
    })
    .join('\n');

  return `export interface ${spec.name}Type {\n${fields}\n}`;
}

function generateContextCreation(spec: ContextSpec): string {
  const defaultValue = JSON.stringify(spec.defaultValue, null, 2);
  return `export const ${spec.name} = createContext<${spec.name}Type>(${defaultValue});`;
}

function generateProviderComponent(spec: ContextSpec): string {
  const stateInitialization = Object.keys(spec.shape)
    .map((key) => {
      const initialValue = spec.defaultValue[key];
      return `  const [${key}, set${capitalize(key)}] = useState(${JSON.stringify(initialValue)});`;
    })
    .join('\n');

  const valueObject = `{
    ${Object.keys(spec.shape)
      .map((key) => `${key}, set${capitalize(key)}`)
      .join(',\n    ')}
  }`;

  return `export function ${spec.name}Provider({ children }: { children: ReactNode }) {
${stateInitialization}

  return (
    <${spec.name}.Provider value={${valueObject}}>
      {children}
    </${spec.name}.Provider>
  );
}`;
}
```

**Acceptance Criteria:**
- [ ] Context files generated
- [ ] Type interface correct
- [ ] Provider component functional
- [ ] Default values set

---

### 6. App & Main Generators (src/generator/app/)

**Files to create:**

#### 6.1 `appGenerator.ts`
```typescript
export function generateAppComponent(instance: InstanceJSON): string {
  const imports = generateAppImports(instance);
  const body = generateAppBody(instance);

  return `${imports}

export function App() {
  ${body}
}
`;
}

function generateAppImports(instance: InstanceJSON): string {
  const imports = ["import React from 'react';"];

  // Check layout field (single source of truth for routing)
  if (instance.appSpec.layout === 'routed') {
    imports.push("import { BrowserRouter, Routes, Route } from 'react-router-dom';");
  }

  // Import root component
  const rootComponent = findRootComponent(instance);
  if (rootComponent) {
    imports.push(`import { ${rootComponent.name} } from '../components/${rootComponent.name}';`);
  }

  return imports.join('\n');
}

function generateAppBody(instance: InstanceJSON): string {
  // Single source of truth: appSpec.layout
  if (instance.appSpec.layout === 'routed') {
    return generateRoutedApp(instance);
  } else {
    return generateSinglePageApp(instance);
  }
}

function generateSinglePageApp(instance: InstanceJSON): string {
  const rootComponent = findRootComponent(instance);
  return `return <${rootComponent?.name || 'div'} />;`;
}

function generateRoutedApp(instance: InstanceJSON): string {
  const rootComponent = findRootComponent(instance);
  const rootComponentName = rootComponent ? rootComponent.name : 'div';

  // Generate routes based on appSpec.routes or use root component at "/"
  const routes = instance.appSpec.routes && instance.appSpec.routes.length > 0
    ? instance.appSpec.routes.map(r => `<Route path="${r.path}" element={<${r.component} />} />`).join('\n        ')
    : `<Route path="/" element={<${rootComponentName} />} />`;

  return `return (
    <BrowserRouter>
      <Routes>
        ${routes}
      </Routes>
    </BrowserRouter>
  );`;
}

function findRootComponent(instance: InstanceJSON): ComponentSpecJSON | null {
  // Find the component marked as root, or first component
  return instance.components.find(c => c.id === instance.appSpec.rootComponentId)
    || instance.components[0]
    || null;
}
```

#### 6.2 `mainGenerator.ts`
```typescript
export function generateMain(instance: InstanceJSON): string {
  const contextProviders = generateContextProviderWrappers(instance.contexts);

  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
${instance.contexts.length > 0 ? `import { ${instance.contexts.map((c) => `${c.name}Provider`).join(', ')} } from './contexts';` : ''}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    ${contextProviders.open}
      <App />
    ${contextProviders.close}
  </React.StrictMode>
);
`;
}

function generateContextProviderWrappers(contexts: ContextSpec[]): { open: string; close: string } {
  const open = contexts.map((c) => `<${c.name}Provider>`).join('\n    ');
  const close = contexts.map((c) => `</${c.name}Provider>`).join('\n    ');
  return { open, close };
}
```

#### 6.3 `appTestGenerator.ts`
```typescript
export function generateAppTest(instance: InstanceJSON): string {
  return `import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
  });
});
`;
}
```

**Acceptance Criteria:**
- [ ] App component generated
- [ ] Routing support if enabled
- [ ] Context providers wrapped
- [ ] Main.tsx bootstraps app
- [ ] App test generated

---

### 7. Formatting & Export (src/generator/)

**Files to create:**

#### 7.1 `formatter.ts` - Prettier formatting
```typescript
import prettier from 'prettier';

export async function formatFiles(files: Record<string, string>): Promise<Record<string, string>> {
  const formatted: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    if (shouldFormat(path)) {
      formatted[path] = await formatCode(content, path);
    } else {
      formatted[path] = content;
    }
  }

  return formatted;
}

function shouldFormat(path: string): boolean {
  return /\.(ts|tsx|js|jsx|json|css|html)$/.test(path);
}

async function formatCode(code: string, path: string): Promise<string> {
  const parser = getParser(path);
  // Prettier v3 format() is async
  return await prettier.format(code, {
    parser,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
  });
}

function getParser(path: string): string {
  if (path.endsWith('.tsx')) return 'typescript';
  if (path.endsWith('.ts')) return 'typescript';
  if (path.endsWith('.json')) return 'json';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  return 'babel';
}
```

#### 7.2 `zipExporter.ts` - ZIP file creation
```typescript
import JSZip from 'jszip';

export async function exportAsZip(files: Record<string, string>, zipName: string): Promise<Blob> {
  const zip = new JSZip();

  // Add all files to zip
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Acceptance Criteria:**
- [ ] All code formatted with Prettier
- [ ] ZIP file created with all files
- [ ] ZIP downloads correctly
- [ ] File structure preserved

---

### 8. Export UI (src/app/components/Export/)

**Files to create:**

#### 8.1 `ExportDialog.tsx` - Export dialog
```typescript
export function ExportDialog({ instance, onClose }: Props) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleExport() {
    setExporting(true);

    try {
      // Validate
      setProgress(10);
      const errors = validateForExport(instance);
      if (errors.length > 0) {
        alert(`Cannot export: ${errors[0].message}`);
        return;
      }

      // Generate file tree (async in Prettier v3)
      setProgress(30);
      const files = await generateFileTree(instance);

      // Create ZIP
      setProgress(70);
      const zipBlob = await exportAsZip(files, `${instance.name}.zip`);

      // Download
      setProgress(90);
      downloadZip(zipBlob, `${instance.name}.zip`);

      setProgress(100);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="export-dialog">
      <h2>Export Project</h2>
      <p>Generate production-ready React application</p>

      {exporting && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="export-actions">
        <button onClick={handleExport} disabled={exporting}>
          Export as ZIP
        </button>
        <button onClick={onClose} disabled={exporting}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Export button in header
- [ ] Progress indicator
- [ ] Validation before export
- [ ] Error messages shown
- [ ] ZIP downloads automatically

---

## Testing Strategy

### Unit Tests
- [ ] File tree generation
- [ ] Component generation
- [ ] Service generation
- [ ] Context generation
- [ ] Formatting

### Integration Tests
- [ ] Full export workflow
- [ ] Generated app runs (npm install, npm test, npm run dev)
- [ ] Tests in generated app pass

### Manual Testing
- [ ] Export simple app
- [ ] Export app with routing
- [ ] Export app with contexts
- [ ] Verify generated code quality

---

## Definition of Done

- [ ] File tree generator works
- [ ] All config files generated
- [ ] Components generated with correct syntax
- [ ] Services generated
- [ ] Contexts generated
- [ ] Tests generated based on testLevel
- [ ] All code formatted with Prettier
- [ ] ZIP export works
- [ ] Generated app builds successfully
- [ ] Generated tests pass
- [ ] Validation blocks invalid exports
- [ ] Export UI polished
- [ ] All tests passing
- [ ] Documentation updated

---

## Estimated Effort
- File tree generator: 8 hours
- Config generators: 6 hours
- Component generator: 16 hours
- Service generator: 8 hours
- Context generator: 6 hours
- App & main generators: 6 hours
- Formatting & ZIP: 6 hours
- Export UI: 4 hours
- Testing (manual + automated): 12 hours

**Total: ~72 hours (1.5 weeks)**
