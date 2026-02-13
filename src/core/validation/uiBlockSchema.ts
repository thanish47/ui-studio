/**
 * Zod schema for UIBlock validation
 */

import { z } from 'zod';

// Base block schema
const baseBlockSchema = z.object({
  type: z.string(),
  key: z.string().optional(),
  className: z.string().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
});

// Specific block schemas
const stackBlockSchema = baseBlockSchema.extend({
  type: z.literal('Stack'),
  direction: z.enum(['horizontal', 'vertical']).optional(),
  spacing: z.number().optional(),
  alignment: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  children: z.lazy(() => z.array(uiBlockSchema)),
});

const cardBlockSchema = baseBlockSchema.extend({
  type: z.literal('Card'),
  title: z.string().optional(),
  children: z.lazy(() => z.array(uiBlockSchema)),
});

const headingBlockSchema = baseBlockSchema.extend({
  type: z.literal('Heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  text: z.string(),
});

const textBlockSchema = baseBlockSchema.extend({
  type: z.literal('Text'),
  content: z.string(),
  variant: z.enum(['body', 'caption', 'label']).optional(),
});

const buttonBlockSchema = baseBlockSchema.extend({
  type: z.literal('Button'),
  text: z.string(),
  variant: z.enum(['primary', 'secondary', 'danger']).optional(),
  disabled: z.union([z.boolean(), z.string()]).optional(),
  onClick: z.string().optional(),
});

const inputBlockSchema = baseBlockSchema.extend({
  type: z.literal('Input'),
  inputType: z.enum(['text', 'email', 'password', 'number']).optional(),
  placeholder: z.string().optional(),
  value: z.string().optional(),
  onChange: z.string().optional(),
  disabled: z.union([z.boolean(), z.string()]).optional(),
});

const selectOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const selectBlockSchema = baseBlockSchema.extend({
  type: z.literal('Select'),
  options: z.array(selectOptionSchema),
  value: z.string().optional(),
  onChange: z.string().optional(),
  placeholder: z.string().optional(),
});

const tableColumnSchema = z.object({
  header: z.string(),
  accessor: z.string(),
  render: z.string().optional(),
});

const tableBlockSchema = baseBlockSchema.extend({
  type: z.literal('Table'),
  columns: z.array(tableColumnSchema),
  dataSource: z.string(),
  rowKey: z.string().optional(),
});

const alertBlockSchema = baseBlockSchema.extend({
  type: z.literal('Alert'),
  severity: z.enum(['info', 'success', 'warning', 'error']),
  message: z.string(),
  closable: z.boolean().optional(),
});

// Union of all block types
export const uiBlockSchema: z.ZodType<any> = z.union([
  stackBlockSchema,
  cardBlockSchema,
  headingBlockSchema,
  textBlockSchema,
  buttonBlockSchema,
  inputBlockSchema,
  selectBlockSchema,
  tableBlockSchema,
  alertBlockSchema,
]);
