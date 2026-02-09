# Milestone 1: Core & Persistence

## Overview
Implement the foundational layer: schemas, validation, IndexedDB storage, locking mechanism, and migration framework.

## Goals
- Define TypeScript interfaces for all JSON schemas
- Implement Zod validation schemas
- Create IndexedDB adapter with CRUD operations
- Implement per-instance locking with BroadcastChannel
- Create schema migration framework
- Build basic instance home screen

---

## Tasks

### 1. Project Setup
**Files to create:**
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Prettier configuration

**Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

**Acceptance Criteria:**
- [ ] Project builds successfully with `npm run dev`
- [ ] TypeScript strict mode enabled
- [ ] ESLint and Prettier configured

---

### 2. Schema Definitions (src/core/schema/)

**Files to create:**

#### 2.1 `types.ts` - Core type definitions
```typescript
export interface InstanceJSON {
  id: string;
  schemaVersion: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  appSpec: AppSpecJSON;
  folders: FolderSpecJSON[];
  components: ComponentSpecJSON[];
  services: ServiceSpecJSON[];
  contexts: ContextSpec[];
  mocks: MockData;
}
```

#### 2.2 `appSpec.ts` - Application spec types
```typescript
export interface AppSpecJSON {
  name: string;
  layout: "single-page" | "routed";
  routing?: RoutingConfig;
  contexts?: ContextSpec[];
  errorBoundary?: ErrorBoundaryConfig;
  theme?: ThemeConfig;
  testStrategy: "all" | "entry-points-only";
}
```

#### 2.3 `componentSpec.ts` - Component spec types
```typescript
export interface ComponentSpecJSON {
  id: string;
  name: string;
  props: PropDef[];
  events?: EventDef[];
  localState?: StateDef[];
  consumesContexts?: string[];
  ui: UIBlock[];
  dataSource?: DataSourceConfig;
  testLevel?: "none" | "smoke" | "full";
}
```

#### 2.4 `serviceSpec.ts` - Service spec types
#### 2.5 `folderSpec.ts` - Folder spec types
#### 2.6 `contextSpec.ts` - Context spec types
#### 2.7 `uiBlock.ts` - UIBlock DSL types
#### 2.8 `index.ts` - Barrel exports

**Acceptance Criteria:**
- [ ] All TypeScript interfaces match plan.md section 8
- [ ] No `any` types used
- [ ] All interfaces exported properly
- [ ] JSDoc comments for complex types

---

### 3. Validation (src/core/validation/)

**Files to create:**

#### 3.1 `instanceSchema.ts` - Zod schema for InstanceJSON
```typescript
import { z } from 'zod';

export const instanceSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.number().int().positive(),
  name: z.string().min(1).max(100),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  appSpec: appSpecSchema,
  folders: z.array(folderSpecSchema),
  components: z.array(componentSpecSchema),
  services: z.array(serviceSpecSchema),
  contexts: z.array(contextSpecSchema),
  mocks: mockDataSchema,
});
```

#### 3.2 `appSpecSchema.ts` - Zod schema for AppSpecJSON
#### 3.3 `componentSpecSchema.ts` - Zod schema for ComponentSpecJSON
#### 3.4 `validators.ts` - Validation functions
```typescript
export function validateInstance(data: unknown): InstanceJSON {
  return instanceSchema.parse(data);
}

export function validateNamingConventions(instance: InstanceJSON): ValidationError[] {
  // Check PascalCase for components
  // Check kebab-case for folders
  // Check camelCase for services
  // Return array of errors
}

export function validateReferences(instance: InstanceJSON): ValidationError[] {
  // Check all IDs exist
  // Check context references
  // Check state bindings
  // Return array of errors
}
```

#### 3.5 `performanceLimits.ts` - Performance validation
```typescript
export function validatePerformanceLimits(instance: InstanceJSON): ValidationError[] {
  const errors: ValidationError[] = [];

  if (instance.components.length > 500) {
    errors.push({ type: 'PERFORMANCE', message: 'Max 500 components exceeded' });
  }

  // Check tree depth
  // Check spec size
  // Check context count

  return errors;
}
```

**Acceptance Criteria:**
- [ ] All schemas validate according to plan.md section 11
- [ ] Naming conventions enforced
- [ ] Reference validation works
- [ ] Performance limits enforced
- [ ] Clear error messages

---

### 4. IndexedDB Adapter (src/core/idb/)

**Files to create:**

#### 4.1 `database.ts` - Database setup
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface UIStudioDB extends DBSchema {
  instances: {
    key: string;
    value: InstanceJSON;
    indexes: { 'by-updated': number };
  };
  locks: {
    key: string; // instanceId
    value: LockRecord;
  };
  secrets: {
    key: string;
    value: string;
  };
}

export async function initDatabase(): Promise<IDBPDatabase<UIStudioDB>> {
  return openDB<UIStudioDB>('ui-studio', 1, {
    upgrade(db) {
      // Create instances store
      const instanceStore = db.createObjectStore('instances', { keyPath: 'id' });
      instanceStore.createIndex('by-updated', 'updatedAt');

      // Create locks store
      db.createObjectStore('locks', { keyPath: 'instanceId' });

      // Create secrets store
      db.createObjectStore('secrets');
    },
  });
}
```

#### 4.2 `instanceRepository.ts` - Instance CRUD operations
```typescript
export class InstanceRepository {
  constructor(private db: IDBPDatabase<UIStudioDB>) {}

  async getAll(): Promise<InstanceJSON[]> {
    return this.db.getAll('instances');
  }

  async getById(id: string): Promise<InstanceJSON | undefined> {
    return this.db.get('instances', id);
  }

  async create(instance: InstanceJSON): Promise<void> {
    await this.db.add('instances', instance);
  }

  async update(instance: InstanceJSON): Promise<void> {
    instance.updatedAt = Date.now();
    await this.db.put('instances', instance);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete('instances', id);
  }

  async getAllSortedByUpdated(): Promise<InstanceJSON[]> {
    return this.db.getAllFromIndex('instances', 'by-updated');
  }
}
```

**Acceptance Criteria:**
- [ ] Database initializes correctly
- [ ] All CRUD operations work
- [ ] Indexes created properly
- [ ] Error handling implemented
- [ ] TypeScript types are correct

---

### 5. Locking Mechanism (src/core/locks/)

**Files to create:**

#### 5.1 `types.ts` - Lock types
```typescript
export interface LockRecord {
  instanceId: string;
  tabId: string;
  ts: number;
}

export type LockMessage =
  | { type: 'lock_acquired'; instanceId: string; tabId: string }
  | { type: 'lock_released'; instanceId: string; tabId: string }
  | { type: 'lock_ping'; instanceId: string; tabId: string };
```

#### 5.2 `lockManager.ts` - Lock manager implementation
```typescript
export class LockManager {
  private channel: BroadcastChannel;
  private tabId: string;
  private heldLocks: Set<string>;
  private pingInterval: number;

  constructor() {
    this.tabId = crypto.randomUUID();
    this.channel = new BroadcastChannel('ui-studio-locks');
    this.heldLocks = new Set();
    this.setupListeners();
    this.startPingLoop();
  }

  async acquireLock(instanceId: string): Promise<boolean> {
    // Check if already locked by another tab
    const existingLock = await this.getLock(instanceId);
    if (existingLock && existingLock.tabId !== this.tabId) {
      // Check if stale (> 5 minutes)
      if (Date.now() - existingLock.ts < 5 * 60 * 1000) {
        return false;
      }
    }

    // Acquire lock
    await this.setLock({ instanceId, tabId: this.tabId, ts: Date.now() });
    this.heldLocks.add(instanceId);
    this.broadcast({ type: 'lock_acquired', instanceId, tabId: this.tabId });
    return true;
  }

  async releaseLock(instanceId: string): Promise<void> {
    await this.deleteLock(instanceId);
    this.heldLocks.delete(instanceId);
    this.broadcast({ type: 'lock_released', instanceId, tabId: this.tabId });
  }

  async releaseAllLocks(): Promise<void> {
    for (const instanceId of this.heldLocks) {
      await this.releaseLock(instanceId);
    }
  }

  private setupListeners(): void {
    // Listen for messages from other tabs
    this.channel.onmessage = (event) => {
      // Handle lock messages
    };

    // Release locks on page unload
    window.addEventListener('beforeunload', () => {
      this.releaseAllLocks();
    });
  }

  private startPingLoop(): void {
    // Ping every 30 seconds to keep locks alive
    this.pingInterval = window.setInterval(() => {
      for (const instanceId of this.heldLocks) {
        this.broadcast({ type: 'lock_ping', instanceId, tabId: this.tabId });
      }
    }, 30000);
  }
}
```

**Acceptance Criteria:**
- [ ] Per-instance locking works
- [ ] Multiple instances can be open in different tabs
- [ ] Same instance cannot be opened in multiple tabs
- [ ] Stale lock cleanup works (5 minutes)
- [ ] Locks released on tab close
- [ ] BroadcastChannel messaging works

---

### 6. Migration Framework (src/core/migrations/)

**Files to create:**

#### 6.1 `types.ts` - Migration types
```typescript
export type MigrationFn = (instance: any) => any;

export const CURRENT_SCHEMA_VERSION = 1;
```

#### 6.2 `registry.ts` - Migration registry
```typescript
export const migrations: Record<number, MigrationFn> = {
  // Example migration for version 2
  // 2: (instance: any) => ({
  //   ...instance,
  //   schemaVersion: 2,
  //   appSpec: { ...instance.appSpec, contexts: [] },
  // }),
};
```

#### 6.3 `migrator.ts` - Migration executor
```typescript
export function migrateInstance(instance: any): InstanceJSON {
  if (!instance.schemaVersion) {
    throw new Error('Instance missing schemaVersion');
  }

  let current = instance;
  const targetVersion = CURRENT_SCHEMA_VERSION;

  for (let v = instance.schemaVersion + 1; v <= targetVersion; v++) {
    if (migrations[v]) {
      console.log(`Migrating instance ${instance.id} from v${v-1} to v${v}`);
      current = migrations[v](current);
    }
  }

  // Validate migrated instance
  return validateInstance(current);
}
```

**Acceptance Criteria:**
- [ ] Migration registry exists
- [ ] Migrations applied sequentially
- [ ] Validation after migration
- [ ] Logging for debugging
- [ ] Error handling

---

### 7. Instance Home Screen (src/app/pages/)

**Files to create:**

#### 7.1 `HomePage.tsx` - Main home screen
```typescript
export function HomePage() {
  const [instances, setInstances] = useState<InstanceJSON[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstances();
  }, []);

  async function loadInstances() {
    const repo = new InstanceRepository(await initDatabase());
    const allInstances = await repo.getAllSortedByUpdated();
    setInstances(allInstances);
    setLoading(false);
  }

  async function createNewInstance() {
    const newInstance: InstanceJSON = {
      id: crypto.randomUUID(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: 'New Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      appSpec: createDefaultAppSpec(),
      folders: [],
      components: [],
      services: [],
      contexts: [],
      mocks: {},
    };

    const repo = new InstanceRepository(await initDatabase());
    await repo.create(newInstance);
    setInstances([...instances, newInstance]);
  }

  return (
    <div>
      <h1>UI Studio</h1>
      <button onClick={createNewInstance}>Create New Project</button>
      {loading ? <div>Loading...</div> : <InstanceList instances={instances} />}
    </div>
  );
}
```

#### 7.2 `InstanceList.tsx` - List of instances
#### 7.3 `InstanceCard.tsx` - Single instance card

**Acceptance Criteria:**
- [ ] List all instances
- [ ] Create new instance
- [ ] Delete instance
- [ ] Open instance (with lock check)
- [ ] Show instance metadata (name, updated date)
- [ ] Responsive UI

---

## Testing Strategy

### Unit Tests
- [ ] Schema validation tests
- [ ] Migration tests
- [ ] Lock manager tests
- [ ] Repository CRUD tests

### Integration Tests
- [ ] Full instance lifecycle (create → update → delete)
- [ ] Multi-tab locking scenarios
- [ ] Migration from old schema

---

## Definition of Done

- [ ] All TypeScript interfaces defined
- [ ] All Zod schemas implemented
- [ ] IndexedDB adapter working with CRUD operations
- [ ] Lock manager prevents concurrent edits
- [ ] Migration framework ready for future schema changes
- [ ] Basic home screen displays instances
- [ ] Can create, list, and delete instances
- [ ] All tests passing
- [ ] Code reviewed and formatted
- [ ] Documentation updated

---

## Estimated Effort
- Schema definitions: 4 hours
- Validation: 6 hours
- IndexedDB adapter: 6 hours
- Lock manager: 8 hours
- Migration framework: 4 hours
- Home screen UI: 6 hours
- Testing: 6 hours

**Total: ~40 hours (1 week)**
