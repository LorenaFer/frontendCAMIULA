import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockSchemas, fallbackSchema } from './mock/schemas.js';
import type { MedicalFormSchema } from '$shared/types/form-schema.js';

/** Cache en memoria para schemas (cambian con poca frecuencia) */
const schemaCache = new Map<string, MedicalFormSchema>();

/** Normaliza un nombre de especialidad a key de schema (ej: "Medicina General" → "medicina-general") */
function normalizeSpecialtyName(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

/** Mapea la respuesta raw del backend a MedicalFormSchema */
function mapRawSchema(raw: Record<string, unknown>): MedicalFormSchema {
	const schemaJson = typeof raw.schema_json === 'string' ? JSON.parse(raw.schema_json) : raw.schema_json;
	return {
		id: String(raw.id ?? raw.specialty_id),
		specialtyId: String(raw.specialty_id),
		specialtyName: String(raw.specialty_name),
		version: String(raw.version ?? '1.0'),
		sections: (schemaJson as Record<string, unknown>)?.sections as MedicalFormSchema['sections'] ?? []
	};
}

/**
 * Obtiene el schema de formulario para una especialidad.
 * Acepta specialtyId (key normalizado o UUID).
 * Backend es la fuente principal, mock como fallback.
 */
export async function getFormSchema(specialtyIdOrName: string): Promise<MedicalFormSchema> {
	const normalizedKey = normalizeSpecialtyName(specialtyIdOrName);

	const cached = schemaCache.get(normalizedKey) ?? schemaCache.get(specialtyIdOrName);
	if (cached) return cached;

	let schema: MedicalFormSchema;

	if (mockFlags.schemas) {
		schema = mockSchemas[normalizedKey] ?? mockSchemas[specialtyIdOrName] ?? fallbackSchema;
	} else {
		try {
			const raw = await apiFetch<Record<string, unknown>>(`/schemas/${specialtyIdOrName}`);
			schema = mapRawSchema(raw);
			if (schema.sections.length === 0) {
				schema = mockSchemas[normalizedKey] ?? mockSchemas[specialtyIdOrName] ?? fallbackSchema;
			}
		} catch {
			schema = mockSchemas[normalizedKey] ?? mockSchemas[specialtyIdOrName] ?? fallbackSchema;
		}
	}

	schemaCache.set(normalizedKey, schema);
	return schema;
}

/** Invalida el cache (útil si el admin actualiza un schema) */
export function invalidateSchemaCache(specialtyId?: string): void {
	if (specialtyId) {
		schemaCache.delete(specialtyId);
	} else {
		schemaCache.clear();
	}
}

// ─── CRUD para el Form Builder ──────────────────────────────

/** Obtiene todos los schemas disponibles */
export async function getAllSchemas(): Promise<MedicalFormSchema[]> {
	if (mockFlags.schemas) {
		return Object.values(mockSchemas);
	}

	try {
		const raw = await apiFetch<Record<string, unknown>[]>('/schemas');
		const schemas = raw.map(mapRawSchema).filter(s => s.sections.length > 0);
		return schemas;
	} catch {
		return Object.values(mockSchemas);
	}
}

/** Guarda o actualiza un schema (upsert por specialtyId) */
export async function saveSchema(schema: MedicalFormSchema): Promise<MedicalFormSchema> {
	const normalizedKey = normalizeSpecialtyName(schema.specialtyName);

	if (mockFlags.schemas) {
		mockSchemas[normalizedKey] = schema;
		schemaCache.delete(normalizedKey);
		return schema;
	}

	const saved = await apiFetch<Record<string, unknown>>('/schemas', {
		method: 'PUT',
		body: JSON.stringify({
			specialty_id: schema.specialtyId,
			specialty_name: schema.specialtyName,
			version: schema.version,
			schema_json: { sections: schema.sections }
		})
	}).then(mapRawSchema);
	schemaCache.delete(normalizedKey);
	return saved;
}

/** Elimina un schema por su key normalizado */
export async function deleteSchema(specialtyKey: string): Promise<void> {
	const normalizedKey = normalizeSpecialtyName(specialtyKey);

	if (mockFlags.schemas) {
		delete mockSchemas[normalizedKey];
		schemaCache.delete(normalizedKey);
		return;
	}

	await apiFetch(`/schemas/${normalizedKey}`, { method: 'DELETE' });
	schemaCache.delete(normalizedKey);
}
