import type { MedicalFormSchema, FormFieldSchema } from '$domain/medical-records/form-schema.js';
import { getNestedValue, setNestedValue, evaluateConditions } from './utils.js';
import { validateFieldValue, validateAllFields } from './validators.js';

type AutosaveCallback = (data: Record<string, unknown>) => Promise<void>;

export class FormStore {
	// ─── Estado reactivo ──────────────────────────────────────
	data = $state<Record<string, unknown>>({});
	errors = $state<Record<string, string>>({});
	touched = $state<Record<string, boolean>>({});
	isSaving = $state(false);
	lastSavedAt = $state<string | null>(null);

	// ─── Tracking de cambios (reemplaza JSON.stringify dirty-check) ──
	private _changedKeys = $state(new Set<string>());

	// ─── Derivados ───────────────────────────────────────────
	isDirty = $derived(this._changedKeys.size > 0);
	isValid = $derived(Object.keys(this.errors).length === 0);
	errorCount = $derived(Object.keys(this.errors).length);

	// ─── Internos ────────────────────────────────────────────
	private _initialSnapshot: string;
	private _schema: MedicalFormSchema;
	private _autosaveTimer: ReturnType<typeof setTimeout> | null = null;
	private _autosaveCallback: AutosaveCallback | null = null;
	private _autosaveDelay: number;

	constructor(
		schema: MedicalFormSchema,
		initialData: Record<string, unknown> = {},
		options?: {
			autosaveCallback?: AutosaveCallback;
			autosaveDelay?: number;
		}
	) {
		this._schema = schema;
		this._autosaveCallback = options?.autosaveCallback ?? null;
		this._autosaveDelay = options?.autosaveDelay ?? 3000;

		// Construir estado inicial: defaults del schema + datos existentes
		this.data = this._buildInitialState(schema, initialData);
		this._initialSnapshot = JSON.stringify(this.data); this._changedKeys = new Set();
	}

	// ─── Acceso a valores ────────────────────────────────────

	getValue(path: string): unknown {
		return getNestedValue(this.data, path);
	}

	setValue(path: string, value: unknown, fieldSchema?: FormFieldSchema): void {
		this.data = setNestedValue(this.data, path, value);
		this.touched[path] = true;
		this._changedKeys = new Set([...this._changedKeys, path]);

		// Validar campo si tenemos el schema
		if (fieldSchema) {
			const error = validateFieldValue(value, fieldSchema.validation, fieldSchema.label);
			if (error) {
				this.errors[path] = error;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete this.errors[path];
				this.errors = { ...this.errors };
			}
		}

		this._scheduleAutosave();
	}

	// ─── Validación ──────────────────────────────────────────

	validateAll(): boolean {
		this.errors = validateAllFields(this._schema.sections, this.data);
		// Marcar todos los campos con error como touched para que se muestren visualmente
		for (const path of Object.keys(this.errors)) {
			this.touched[path] = true;
		}
		this.touched = { ...this.touched }; // Trigger reactivity
		return Object.keys(this.errors).length === 0;
	}

	/** Retorna los nombres legibles de los campos con error */
	getErrorFieldNames(): string[] {
		const names: string[] = [];
		for (const section of this._schema.sections) {
			for (const group of section.groups) {
				for (const field of group.fields) {
					if (this.errors[field.key]) {
						names.push(field.label);
					}
				}
			}
		}
		return names;
	}

	getFieldError(path: string): string | undefined {
		return this.touched[path] ? this.errors[path] : undefined;
	}

	// ─── Guardado ────────────────────────────────────────────

	getSubmitData(): Record<string, unknown> {
		return $state.snapshot(this.data) as Record<string, unknown>;
	}

	/** Marca el formulario como limpio (sin cambios pendientes) */
	markClean(): void {
		this._initialSnapshot = JSON.stringify(this.data);
		this._changedKeys = new Set();
		this.lastSavedAt = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
	}

	async save(callback: (data: Record<string, unknown>) => Promise<void>): Promise<boolean> {
		if (!this.validateAll()) return false;

		this.isSaving = true;
		try {
			await callback(this.getSubmitData());
			this._initialSnapshot = JSON.stringify(this.data); this._changedKeys = new Set();
			this.lastSavedAt = new Date().toLocaleTimeString('es-VE', {
				hour: '2-digit',
				minute: '2-digit'
			});
			return true;
		} finally {
			this.isSaving = false;
		}
	}

	// ─── Autosave ────────────────────────────────────────────

	private _scheduleAutosave(): void {
		if (!this._autosaveCallback) return;

		if (this._autosaveTimer) clearTimeout(this._autosaveTimer);
		this._autosaveTimer = setTimeout(() => this._performAutosave(), this._autosaveDelay);
	}

	private async _performAutosave(): Promise<void> {
		if (!this._autosaveCallback || this._changedKeys.size === 0) return;

		this.isSaving = true;
		try {
			await this._autosaveCallback(this.getSubmitData());
			this._initialSnapshot = JSON.stringify(this.data); this._changedKeys = new Set();
			this.lastSavedAt = new Date().toLocaleTimeString('es-VE', {
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			// Autosave silencioso — no bloquea al doctor
		} finally {
			this.isSaving = false;
		}
	}

	// ─── Cleanup ─────────────────────────────────────────────

	destroy(): void {
		if (this._autosaveTimer) {
			clearTimeout(this._autosaveTimer);
			this._autosaveTimer = null;
		}
	}

	// ─── Helpers internos ────────────────────────────────────

	private _computeIsDirty(): boolean {
		return this._changedKeys.size > 0;
	}

	private _buildInitialState(
		schema: MedicalFormSchema,
		existingData: Record<string, unknown>
	): Record<string, unknown> {
		const state: Record<string, unknown> = {};

		for (const section of schema.sections) {
			for (const group of section.groups) {
				for (const field of group.fields) {
					const existing = getNestedValue(existingData, field.key);
					const value = existing !== undefined ? existing : (field.defaultValue ?? this._getTypeDefault(field.type));

					// Establecer usando dot-path
					const keys = field.key.split('.');
					if (keys.length === 1) {
						state[keys[0]] = value;
					} else {
						// Construir estructura anidada
						let current = state;
						for (let i = 0; i < keys.length - 1; i++) {
							if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
								current[keys[i]] = {};
							}
							current = current[keys[i]] as Record<string, unknown>;
						}
						current[keys[keys.length - 1]] = value;
					}
				}
			}
		}

		return state;
	}

	private _getTypeDefault(type: string): unknown {
		switch (type) {
			case 'checkbox':
			case 'switch':
				return false;
			case 'checkbox_group':
				return [];
			case 'table':
				return [];
			case 'number':
				return undefined;
			default:
				return '';
		}
	}
}
