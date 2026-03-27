import type {
	MedicalFormSchema,
	FormSection,
	FormFieldGroup,
	FormFieldSchema,
	FieldType
} from '$shared/types/form-schema.js';

// ─── Helpers ────────────────────────────────────────────────

let _counter = 0;
function uid(): string {
	return (++_counter).toString(36) + Math.random().toString(36).slice(2, 8);
}

function labelToKey(label: string, sectionPrefix?: string): string {
	const base = label
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_]/g, '');
	return sectionPrefix ? `${sectionPrefix}.${base}` : base;
}

function createDefaultField(type: FieldType = 'text'): FormFieldSchema {
	return {
		key: `field_${uid()}`,
		type,
		label: 'Nuevo campo',
		placeholder: ''
	};
}

function createDefaultGroup(): FormFieldGroup {
	return {
		id: `grp-${uid()}`,
		fields: [createDefaultField()]
	};
}

function createDefaultSection(): FormSection {
	return {
		id: `sec-${uid()}`,
		title: 'Nueva Sección',
		groups: [createDefaultGroup()]
	};
}

// ─── Store ──────────────────────────────────────────────────

export class FormBuilderStore {
	schema = $state.raw<MedicalFormSchema>({
		id: '',
		version: '1.0',
		specialtyId: '',
		specialtyName: '',
		sections: []
	});

	/** Counter to force FormEngine re-mount on structural changes */
	revision = $state(0);

	sectionCount = $derived(this.schema.sections.length);
	fieldCount = $derived(
		this.schema.sections.reduce(
			(t, s) => t + s.groups.reduce((gt, g) => gt + g.fields.length, 0),
			0
		)
	);

	constructor(initial?: MedicalFormSchema) {
		if (initial) {
			this.schema = JSON.parse(JSON.stringify(initial));
		}
	}

	// ─── Schema metadata ────────────────────────────────────

	updateMeta(updates: Partial<Pick<MedicalFormSchema, 'specialtyName' | 'specialtyId' | 'version'>>) {
		this.schema = { ...this.schema, ...updates };
	}

	// ─── Section operations ─────────────────────────────────

	addSection() {
		this.schema.sections = [...this.schema.sections, createDefaultSection()];
		this.revision++;
	}

	removeSection(sectionId: string) {
		this.schema.sections = this.schema.sections.filter((s) => s.id !== sectionId);
		this.revision++;
	}

	updateSection(sectionId: string, updates: Partial<Pick<FormSection, 'title' | 'description' | 'icon' | 'collapsible' | 'defaultCollapsed'>>) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId ? { ...s, ...updates } : s
		);
	}

	moveSection(sectionId: string, direction: 'up' | 'down') {
		const idx = this.schema.sections.findIndex((s) => s.id === sectionId);
		if (idx === -1) return;
		const newIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (newIdx < 0 || newIdx >= this.schema.sections.length) return;

		const arr = [...this.schema.sections];
		[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
		this.schema.sections = arr;
		this.revision++;
	}

	// ─── Group operations ───────────────────────────────────

	addGroup(sectionId: string) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId ? { ...s, groups: [...s.groups, createDefaultGroup()] } : s
		);
		this.revision++;
	}

	removeGroup(sectionId: string, groupId: string) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId
				? { ...s, groups: s.groups.filter((g) => g.id !== groupId) }
				: s
		);
		this.revision++;
	}

	updateGroup(sectionId: string, groupId: string, updates: Partial<Pick<FormFieldGroup, 'label' | 'description' | 'columns'>>) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId
				? { ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)) }
				: s
		);
	}

	moveGroup(sectionId: string, groupId: string, direction: 'up' | 'down') {
		this.schema.sections = this.schema.sections.map((s) => {
			if (s.id !== sectionId) return s;
			const idx = s.groups.findIndex((g) => g.id === groupId);
			if (idx === -1) return s;
			const newIdx = direction === 'up' ? idx - 1 : idx + 1;
			if (newIdx < 0 || newIdx >= s.groups.length) return s;
			const arr = [...s.groups];
			[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
			return { ...s, groups: arr };
		});
		this.revision++;
	}

	// ─── Field operations ───────────────────────────────────

	addField(sectionId: string, groupId: string, type: FieldType = 'text') {
		const section = this.schema.sections.find((s) => s.id === sectionId);
		const sectionPrefix = section?.title
			? labelToKey(section.title)
			: undefined;
		const field = createDefaultField(type);
		field.key = labelToKey(field.label, sectionPrefix);

		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId
				? {
						...s,
						groups: s.groups.map((g) =>
							g.id === groupId ? { ...g, fields: [...g.fields, field] } : g
						)
					}
				: s
		);
		this.revision++;
	}

	removeField(sectionId: string, groupId: string, fieldKey: string) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId
				? {
						...s,
						groups: s.groups.map((g) =>
							g.id === groupId
								? { ...g, fields: g.fields.filter((f) => f.key !== fieldKey) }
								: g
						)
					}
				: s
		);
		this.revision++;
	}

	updateField(sectionId: string, groupId: string, fieldKey: string, updates: Partial<FormFieldSchema>) {
		this.schema.sections = this.schema.sections.map((s) =>
			s.id === sectionId
				? {
						...s,
						groups: s.groups.map((g) =>
							g.id === groupId
								? {
										...g,
										fields: g.fields.map((f) =>
											f.key === fieldKey ? { ...f, ...updates } : f
										)
									}
								: g
						)
					}
				: s
		);
	}

	moveField(sectionId: string, groupId: string, fieldKey: string, direction: 'up' | 'down') {
		this.schema.sections = this.schema.sections.map((s) => {
			if (s.id !== sectionId) return s;
			return {
				...s,
				groups: s.groups.map((g) => {
					if (g.id !== groupId) return g;
					const idx = g.fields.findIndex((f) => f.key === fieldKey);
					if (idx === -1) return g;
					const newIdx = direction === 'up' ? idx - 1 : idx + 1;
					if (newIdx < 0 || newIdx >= g.fields.length) return g;
					const arr = [...g.fields];
					[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
					return { ...g, fields: arr };
				})
			};
		});
		this.revision++;
	}

	// ─── Validation ─────────────────────────────────────────

	getErrors(): string[] {
		const errors: string[] = [];
		if (!this.schema.specialtyName) errors.push('El nombre de la especialidad es obligatorio');
		if (this.schema.sections.length === 0) errors.push('Debe haber al menos una sección');

		// Check duplicate keys
		const allKeys = this.schema.sections.flatMap((s) =>
			s.groups.flatMap((g) => g.fields.map((f) => f.key))
		);
		const seen = new Set<string>();
		for (const key of allKeys) {
			if (seen.has(key)) errors.push(`Clave duplicada: "${key}"`);
			seen.add(key);
		}

		// Check empty titles
		for (const s of this.schema.sections) {
			if (!s.title.trim()) errors.push('Todas las secciones deben tener título');
		}

		return errors;
	}

	isValid(): boolean {
		return this.getErrors().length === 0;
	}

	// ─── Serialization ──────────────────────────────────────

	toJSON(): MedicalFormSchema {
		return JSON.parse(JSON.stringify(this.schema));
	}
}
