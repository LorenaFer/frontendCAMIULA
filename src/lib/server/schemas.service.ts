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
		.replace(/[\u0300-\u036f]/g, '') // quitar acentos
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');
}

/**
 * Obtiene el schema de formulario para una especialidad.
 * Acepta specialtyId (UUID) o nombre de especialidad.
 * Usa cache en memoria para evitar llamadas repetidas al backend.
 */
export async function getFormSchema(specialtyIdOrName: string): Promise<MedicalFormSchema> {
	// Intentar como key normalizado (para nombres como "Medicina General")
	const normalizedKey = normalizeSpecialtyName(specialtyIdOrName);

	const cached = schemaCache.get(normalizedKey) ?? schemaCache.get(specialtyIdOrName);
	if (cached) return cached;

	let schema: MedicalFormSchema;

	if (mockFlags.schemas) {
		schema = mockSchemas[normalizedKey] ?? mockSchemas[specialtyIdOrName] ?? fallbackSchema;
	} else {
		try {
			const raw = await apiFetch<Record<string, unknown>>(`/schemas/${specialtyIdOrName}`);
			// El backend puede devolver schema_json como string o como objeto
			const schemaJson = typeof raw.schema_json === 'string' ? JSON.parse(raw.schema_json) : raw.schema_json;
			schema = {
				id: String(raw.id ?? raw.specialty_id ?? specialtyIdOrName),
				specialtyId: String(raw.specialty_id ?? specialtyIdOrName),
				specialtyName: String(raw.specialty_name ?? specialtyIdOrName),
				version: String(raw.version ?? '1.0'),
				sections: schemaJson?.sections ?? []
			};
			// Si el schema del backend está vacío (0 secciones), usar fallback con contenido real
			if (schema.sections.length === 0) {
				const mock = mockSchemas[normalizedKey] ?? mockSchemas[specialtyIdOrName];
				if (mock) schema = mock;
				else schema = fallbackSchema;
			}
		} catch {
			// Si el backend no tiene schema para esta especialidad, usar mock o fallback
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
	return apiFetch<MedicalFormSchema[]>('/schemas');
}

/** Guarda o actualiza un schema (upsert por specialtyId) */
export async function saveSchema(schema: MedicalFormSchema): Promise<MedicalFormSchema> {
	const normalizedKey = normalizeSpecialtyName(schema.specialtyName);

	if (mockFlags.schemas) {
		mockSchemas[normalizedKey] = schema;
		schemaCache.delete(normalizedKey);
		return schema;
	}

	const saved = await apiFetch<MedicalFormSchema>('/schemas', {
		method: 'PUT',
		body: JSON.stringify(schema)
	});
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
