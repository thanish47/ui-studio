/**
 * UIBlock DSL types
 * Declarative UI structure for component rendering
 */

export type UIBlock =
  | StackBlock
  | CardBlock
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | InputBlock
  | SelectBlock
  | TableBlock
  | AlertBlock;

export interface BaseBlock {
  type: string;
  key?: string;
  className?: string;
  style?: Record<string, string | number>;
  children?: UIBlock[];
}

export interface StackBlock extends BaseBlock {
  type: 'Stack';
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  children: UIBlock[];
}

export interface CardBlock extends BaseBlock {
  type: 'Card';
  title?: string;
  children: UIBlock[];
}

export interface HeadingBlock extends BaseBlock {
  type: 'Heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string; // Can include bindings like "{user.name}"
}

export interface TextBlock extends BaseBlock {
  type: 'Text';
  content: string; // Can include bindings
  variant?: 'body' | 'caption' | 'label';
}

export interface ButtonBlock extends BaseBlock {
  type: 'Button';
  text: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean | string; // Can be binding
  onClick?: string; // Event handler name
}

export interface InputBlock extends BaseBlock {
  type: 'Input';
  inputType?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string; // Binding
  onChange?: string; // Event handler name
  disabled?: boolean | string;
}

export interface SelectBlock extends BaseBlock {
  type: 'Select';
  options: SelectOption[];
  value?: string; // Binding
  onChange?: string; // Event handler name
  placeholder?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface TableBlock extends BaseBlock {
  type: 'Table';
  columns: TableColumn[];
  dataSource: string; // Binding to array (e.g., "{users}")
  rowKey?: string; // Property to use as key
}

export interface TableColumn {
  header: string;
  accessor: string; // Property path (e.g., "user.name")
  render?: string; // Optional render function name
}

export interface AlertBlock extends BaseBlock {
  type: 'Alert';
  severity: 'info' | 'success' | 'warning' | 'error';
  message: string; // Can include bindings
  closable?: boolean;
}
