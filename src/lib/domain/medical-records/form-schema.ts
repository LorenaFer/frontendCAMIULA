// ============================================================
// Tipos del Motor de Formularios Dinámicos (Schema-Driven UI)
// Define la estructura del JSON que el backend envía por especialidad
// para renderizar formularios médicos adaptativos.
// ============================================================

// ─── Tipos de campo ──────────────────────────────────────────

export type FieldType =
	| 'text'
	| 'textarea'
	| 'number'
	| 'date'
	| 'time'
	| 'select'
	| 'combobox'
	| 'autocomplete'
	| 'checkbox'
	| 'checkbox_group'
	| 'radio'
	| 'switch'
	| 'table'
	| 'widget';

// ─── Validación ──────────────────────────────────────────────

export interface FieldValidation {
	required?: boolean;
	min?: number;
	max?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	patternMessage?: string;
}

// ─── Visibilidad condicional ─────────────────────────────────

export type ConditionOperator =
	| 'eq'
	| 'neq'
	| 'gt'
	| 'lt'
	| 'gte'
	| 'lte'
	| 'in'
	| 'not_in'
	| 'truthy'
	| 'falsy';

export interface FieldCondition {
	/** Dot-path al campo referenciado (ej: "antecedentes.diabetes") */
	field: string;
	operator: ConditionOperator;
	/** Valor de comparación (omitido para truthy/falsy) */
	value?: unknown;
}

// ─── Opciones de select/radio/checkbox_group ─────────────────

export interface FieldOption {
	value: string;
	label: string;
	description?: string;
}

// ─── Schema de tabla dinámica ────────────────────────────────

export interface TableColumnSchema {
	key: string;
	header: string;
	type: 'text' | 'number' | 'date' | 'select';
	options?: FieldOption[];
	width?: string;
	validation?: FieldValidation;
}

export interface TableSchema {
	columns: TableColumnSchema[];
	/** Valores por defecto para una nueva fila */
	defaultRow: Record<string, unknown>;
	minRows?: number;
	maxRows?: number;
	addLabel?: string;
}

// ─── Configuración de widgets especiales ─────────────────────

export type WidgetType =
	| 'dental_chart'
	| 'body_diagram'
	| 'pain_scale'
	| 'vaccination_table'
	| 'lab_grid';

export interface WidgetConfig {
	widgetType: WidgetType;
	/** Props específicos del widget */
	props?: Record<string, unknown>;
}

// ─── Schema de campo ─────────────────────────────────────────

export interface FormFieldSchema {
	/** Identificador único, usado como data path (ej: "examen_fisico.ta") */
	key: string;
	type: FieldType;
	label: string;
	placeholder?: string;
	hint?: string;
	defaultValue?: unknown;
	validation?: FieldValidation;
	/** Todas las condiciones deben cumplirse (AND) para mostrar el campo */
	conditions?: FieldCondition[];
	/** Para select, radio, checkbox_group */
	options?: FieldOption[];
	/** Para type 'table' */
	tableSchema?: TableSchema;
	/** Para type 'widget' */
	widgetConfig?: WidgetConfig;
	/** Columnas en grid de 12 (default según tipo) */
	colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
	/** Unidad a mostrar como sufijo (ej: "mmHg", "kg", "°C") */
	unit?: string;
	/** Filas para textarea */
	rows?: number;
}

// ─── Grupo de campos ─────────────────────────────────────────

export interface FormFieldGroup {
	id: string;
	label?: string;
	description?: string;
	/** Columnas del grid para este grupo (1-6) */
	columns?: 1 | 2 | 3 | 4 | 6;
	fields: FormFieldSchema[];
	conditions?: FieldCondition[];
}

// ─── Sección ─────────────────────────────────────────────────

export interface FormSection {
	id: string;
	title: string;
	description?: string;
	icon?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	groups: FormFieldGroup[];
	conditions?: FieldCondition[];
}

// ─── Schema top-level ────────────────────────────────────────

export interface MedicalFormSchema {
	id: string;
	version: string;
	specialtyId: string;
	specialtyName: string;
	sections: FormSection[];
}
