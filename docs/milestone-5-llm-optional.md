# Milestone 5: LLM Integration (Optional)

## Overview
Integrate LLM capabilities to assist with spec generation. Uses TOON format for 40% token savings. This milestone is optional and can be deferred or skipped.

## Prerequisites
- Milestone 1 completed (Core & Persistence)
- Milestone 2 completed (Builder UI)
- Milestone 3 completed (Preview)
- Milestone 4 completed (Generator & Export)

## Goals
- Install TOON encoder (`@toon-format/toon`)
- Build LLM context from instance (JSON → TOON)
- Integrate with LLM providers (OpenAI, Anthropic)
- Parse and validate LLM responses
- Store API keys securely in IndexedDB
- Provide UI for LLM-assisted spec generation

---

## Tasks

### 1. Install Dependencies

**Dependencies to add:**
```json
{
  "dependencies": {
    "@toon-format/toon": "^2.1.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0"
  }
}
```

**Acceptance Criteria:**
- [ ] Dependencies installed
- [ ] No conflicts
- [ ] Types available

---

### 2. TOON Context Builder (src/llm/)

**Files to create:**

#### 2.1 `contextBuilder.ts` - Build TOON context
```typescript
import { encode } from '@toon-format/toon';
import { InstanceJSON } from '../core/schema/types';

export function buildLLMContext(instance: InstanceJSON): string {
  // Extract relevant parts of instance
  const context = {
    appSpec: instance.appSpec,
    folders: instance.folders,
    components: instance.components,
    services: instance.services,
    contexts: instance.contexts,
  };

  // Convert to TOON format (40% smaller than JSON)
  return encode(context);
}

export function buildComponentContext(
  instance: InstanceJSON,
  componentId: string
): string {
  const component = instance.components.find((c) => c.id === componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }

  const context = {
    appSpec: instance.appSpec,
    component,
    availableContexts: instance.contexts,
    availableServices: instance.services,
  };

  return encode(context);
}

export function buildPromptWithContext(
  userPrompt: string,
  context: string
): string {
  return `# Current Project Context (TOON format)

${context}

# User Request

${userPrompt}

# Instructions

Based on the project context above, generate a valid spec that addresses the user's request. Return the spec in TOON format.`;
}
```

**Acceptance Criteria:**
- [ ] Context builds from instance
- [ ] TOON encoding works
- [ ] Token count reduced by ~40%
- [ ] Prompt template includes context

---

### 3. LLM Providers (src/llm/providers/)

**Files to create:**

#### 3.1 `types.ts` - Provider interface
```typescript
export interface LLMProvider {
  name: string;
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  generateSpec(prompt: string, context: string): Promise<any>;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model?: string;
}
```

#### 3.2 `openai.ts` - OpenAI provider
```typescript
import OpenAI from 'openai';
import { LLMProvider, CompletionOptions } from './types';

export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private client: OpenAI;

  constructor(apiKey: string, model = 'gpt-4-turbo-preview') {
    this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    this.model = model;
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: options?.model || this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    });

    return completion.choices[0].message.content || '';
  }

  async generateSpec(prompt: string, context: string): Promise<any> {
    const fullPrompt = buildPromptWithContext(prompt, context);
    const response = await this.generateCompletion(fullPrompt);

    // Parse TOON response to JSON
    const spec = decode(response);
    return spec;
  }
}
```

#### 3.3 `anthropic.ts` - Anthropic provider
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, CompletionOptions } from './types';

export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic';
  private client: Anthropic;

  constructor(apiKey: string, model = 'claude-3-sonnet-20240229') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const message = await this.client.messages.create({
      model: options?.model || this.model,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  async generateSpec(prompt: string, context: string): Promise<any> {
    const fullPrompt = buildPromptWithContext(prompt, context);
    const response = await this.generateCompletion(fullPrompt);

    // Parse TOON response to JSON
    const spec = decode(response);
    return spec;
  }
}
```

#### 3.4 `factory.ts` - Provider factory
```typescript
export function createProvider(config: LLMConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
```

**Acceptance Criteria:**
- [ ] OpenAI provider works
- [ ] Anthropic provider works
- [ ] Provider interface consistent
- [ ] Error handling robust
- [ ] TOON parsing works

---

### 4. Response Parser (src/llm/)

**Files to create:**

#### 4.1 `parser.ts` - Parse and validate LLM responses
```typescript
import { decode } from '@toon-format/toon';
import { validateComponentSpec, validateServiceSpec } from '../core/validation';

export function parseLLMResponse(response: string, expectedType: 'component' | 'service' | 'context'): any {
  try {
    // Try parsing as TOON first
    const parsed = decode(response);

    // Validate based on expected type
    switch (expectedType) {
      case 'component':
        return validateComponentSpec(parsed);
      case 'service':
        return validateServiceSpec(parsed);
      case 'context':
        return validateContextSpec(parsed);
      default:
        throw new Error(`Unknown spec type: ${expectedType}`);
    }
  } catch (error) {
    console.error('Failed to parse LLM response:', error);

    // Try JSON fallback
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      throw new Error('Invalid response format from LLM');
    }
  }
}

export function extractCodeBlocks(response: string): string[] {
  // Extract code blocks from markdown
  const regex = /```(?:toon|json)?\n([\s\S]*?)\n```/g;
  const matches = [];
  let match;

  while ((match = regex.exec(response)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}
```

**Acceptance Criteria:**
- [ ] TOON parsing works
- [ ] JSON fallback works
- [ ] Validation after parsing
- [ ] Code block extraction
- [ ] Error messages clear

---

### 5. API Key Management (src/core/idb/)

**Files to create:**

#### 5.1 `secretsRepository.ts` - Secure key storage
```typescript
export class SecretsRepository {
  constructor(private db: IDBPDatabase<UIStudioDB>) {}

  async setApiKey(provider: string, key: string): Promise<void> {
    // Encrypt key before storing (basic encryption)
    const encrypted = btoa(key); // Simple base64, should use proper encryption
    await this.db.put('secrets', encrypted, `llm_${provider}`);
  }

  async getApiKey(provider: string): Promise<string | undefined> {
    const encrypted = await this.db.get('secrets', `llm_${provider}`);
    if (!encrypted) return undefined;

    // Decrypt key
    return atob(encrypted);
  }

  async deleteApiKey(provider: string): Promise<void> {
    await this.db.delete('secrets', `llm_${provider}`);
  }

  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return !!key;
  }
}
```

**Acceptance Criteria:**
- [ ] Keys stored in IndexedDB
- [ ] Basic encryption applied
- [ ] Keys retrievable
- [ ] Keys deletable
- [ ] Check if key exists

---

### 6. LLM Settings UI (src/app/components/LLM/)

**Files to create:**

#### 6.1 `LLMSettingsDialog.tsx` - Configure LLM
```typescript
export function LLMSettingsDialog({ onClose }: Props) {
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      const db = await initDatabase();
      const repo = new SecretsRepository(db);
      await repo.setApiKey(provider, apiKey);

      alert('API key saved successfully');
      onClose();
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="llm-settings-dialog">
      <h2>LLM Settings</h2>

      <div className="form-group">
        <label>Provider</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div className="form-group">
        <label>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className="form-group">
        <label>Model (optional)</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gpt-4-turbo-preview"
        />
      </div>

      <div className="form-actions">
        <button onClick={handleSave} disabled={!apiKey || saving}>
          Save
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

#### 6.2 `LLMAssistant.tsx` - AI assistant panel
```typescript
export function LLMAssistant({ instance, onUpdate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    setGenerating(true);

    try {
      // Build context in TOON format
      const context = buildLLMContext(instance);

      // Get provider
      const db = await initDatabase();
      const repo = new SecretsRepository(db);
      const apiKey = await repo.getApiKey('openai');

      if (!apiKey) {
        alert('Please configure LLM settings first');
        return;
      }

      const provider = createProvider({ provider: 'openai', apiKey });

      // Generate spec
      const spec = await provider.generateSpec(prompt, context);

      // Parse and validate
      const validated = parseLLMResponse(JSON.stringify(spec), 'component');

      setResult(validated);
    } catch (error) {
      alert(`Generation failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleAccept() {
    if (result) {
      onUpdate(result);
      setResult(null);
      setPrompt('');
    }
  }

  return (
    <div className="llm-assistant">
      <h3>AI Assistant</h3>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you want to create..."
        rows={4}
      />

      <button onClick={handleGenerate} disabled={!prompt || generating}>
        {generating ? 'Generating...' : 'Generate'}
      </button>

      {result && (
        <div className="llm-result">
          <h4>Generated Spec</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <div className="result-actions">
            <button onClick={handleAccept}>Accept</button>
            <button onClick={() => setResult(null)}>Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Settings dialog functional
- [ ] API keys saved securely
- [ ] Assistant panel integrated
- [ ] Generation works
- [ ] Results can be accepted/rejected
- [ ] Loading states shown

---

### 7. Token Savings Analysis (src/llm/)

**Files to create:**

#### 7.1 `tokenAnalyzer.ts` - Measure token savings
```typescript
export function analyzeTokenSavings(instance: InstanceJSON): {
  jsonSize: number;
  toonSize: number;
  savings: number;
  savingsPercent: number;
} {
  const jsonString = JSON.stringify(instance);
  const toonString = encode(instance);

  const jsonSize = jsonString.length;
  const toonSize = toonString.length;
  const savings = jsonSize - toonSize;
  const savingsPercent = ((savings / jsonSize) * 100).toFixed(1);

  return {
    jsonSize,
    toonSize,
    savings,
    savingsPercent: parseFloat(savingsPercent),
  };
}
```

**Acceptance Criteria:**
- [ ] Token counts accurate
- [ ] Savings calculated
- [ ] Display in UI

---

## Testing Strategy

### Unit Tests
- [ ] Context builder
- [ ] TOON encoding/decoding
- [ ] Response parser
- [ ] Token analyzer

### Integration Tests
- [ ] Full LLM workflow
- [ ] Provider switching
- [ ] API key management

### Manual Testing
- [ ] Test with OpenAI
- [ ] Test with Anthropic
- [ ] Verify token savings
- [ ] Test error cases (invalid API key, network failure)

---

## Definition of Done

- [ ] TOON encoder integrated
- [ ] Context builder works (JSON → TOON)
- [ ] OpenAI provider functional
- [ ] Anthropic provider functional
- [ ] Response parser validates specs
- [ ] API keys stored securely
- [ ] LLM settings UI complete
- [ ] AI assistant panel integrated
- [ ] Token savings measurable (~40%)
- [ ] Error handling robust
- [ ] All tests passing
- [ ] Documentation updated

---

## Estimated Effort
- TOON integration: 4 hours
- Context builder: 6 hours
- LLM providers: 12 hours
- Response parser: 6 hours
- API key management: 4 hours
- Settings UI: 6 hours
- Assistant panel: 8 hours
- Token analyzer: 2 hours
- Testing: 8 hours

**Total: ~56 hours (1 week)**

---

## Notes

- This milestone is **optional** and can be skipped
- TOON provides 40% token savings for LLM costs
- LLM is **assistive**, never the source of truth
- Users always review and approve generated specs
- Consider rate limiting and cost warnings
- Support local LLMs (Ollama, etc.) in future
