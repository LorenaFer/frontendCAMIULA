import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockPacientes, getNextNHM } from './mock/data.js';
import type { Paciente, PacientePublic, DatosMedicos, RelacionUniversidad, Parentesco, Sexo, EstadoCivil, ContactoEmergencia } from '$shared/types/appointments.js';
import { mapPatient, mapPatientPublic, mapPatientToBackend } from './mappers.js';

// ─── Tipos de paginación ────────────────────────────────────

export interface PacientesPaginatedResult {
	items: Paciente[];
	pagination: {
		total: number;
		page: number;
		page_size: number;
		pages: number;
		has_next: boolean;
	};
}

function toPublic(p: Paciente): PacientePublic {
	return { id: p.id, nhm: p.nhm, nombre: p.nombre, apellido: p.apellido, relacion_univ: p.relacion_univ, es_nuevo: p.es_nuevo };
}

export async function getAllPacientes(): Promise<Paciente[]> {
	if (mockFlags.pacientes) {
		return [...mockPacientes].sort((a, b) => a.apellido.localeCompare(b.apellido));
	}
	const raw = await apiFetch<Record<string, unknown>>('/patients?page_size=1000');
	// Backend devuelve paginado { items, pagination }
	const items = Array.isArray(raw) ? raw : ((raw.items as Record<string, unknown>[]) ?? []);
	return items.map(mapPatient);
}

/**
 * Búsqueda y paginación server-side.
 * El backend soporta `search` (busca en cédula, nombre, apellido, NHM).
 */
export async function getPacientesPaginated(params: {
	search?: string;
	page?: number;
	page_size?: number;
}): Promise<PacientesPaginatedResult> {
	const page = params.page ?? 1;
	const pageSize = params.page_size ?? 25;

	if (mockFlags.pacientes) {
		const all = [...mockPacientes].sort((a, b) => a.apellido.localeCompare(b.apellido));
		const searchTerm = params.search?.toLowerCase();
		const filtered = searchTerm
			? all.filter((p) =>
					`${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm) ||
					p.cedula.toLowerCase().includes(searchTerm) ||
					String(p.nhm).includes(params.search!)
				)
			: all;

		const total = filtered.length;
		const pages = Math.ceil(total / pageSize);
		const start = (page - 1) * pageSize;
		return {
			items: filtered.slice(start, start + pageSize),
			pagination: { total, page, page_size: pageSize, pages, has_next: page < pages }
		};
	}

	const qs = new URLSearchParams();
	if (params.search) qs.set('search', params.search);
	qs.set('page', String(page));
	qs.set('page_size', String(pageSize));

	const raw = await apiFetch<Record<string, unknown>>(`/patients?${qs}`);
	const items = (raw.items as Record<string, unknown>[]) ?? [];
	const pagination = raw.pagination as Record<string, unknown>;

	return {
		items: items.map(mapPatient),
		pagination: {
			total: Number(pagination.total),
			page: Number(pagination.page),
			page_size: Number(pagination.page_size),
			pages: Number(pagination.pages),
			has_next: Number(pagination.page) < Number(pagination.pages)
		}
	};
}

/** Retorna solo el total de pacientes (llamada liviana con page_size=1). */
export async function getPacientesTotal(): Promise<number> {
	if (mockFlags.pacientes) {
		return mockPacientes.length;
	}
	const raw = await apiFetch<Record<string, unknown>>('/patients?page=1&page_size=1');
	const pagination = raw.pagination as Record<string, unknown>;
	return Number(pagination.total);
}

/** Obtiene un paciente completo por su ID (UUID). */
export async function getById(id: string): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.id === id) ?? null;
	}
	try {
		const raw = await apiFetch<Record<string, unknown>>(`/patients/full?id=${encodeURIComponent(id)}`);
		return raw ? mapPatient(raw) : null;
	} catch {
		return null;
	}
}

export async function findByNHM(nhm: number): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.nhm === nhm);
		return p ? toPublic(p) : null;
	}
	const raw = await apiFetch<Record<string, unknown> | null>(`/patients?nhm=${nhm}`);
	return raw ? mapPatientPublic(raw) : null;
}

export async function findByCedula(cedula: string): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.cedula === cedula);
		return p ? toPublic(p) : null;
	}
	const raw = await apiFetch<Record<string, unknown> | null>(`/patients?cedula=${encodeURIComponent(cedula)}`);
	return raw ? mapPatientPublic(raw) : null;
}

export async function findFullByCedula(cedula: string): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.cedula === cedula) ?? null;
	}
	const raw = await apiFetch<Record<string, unknown> | null>(`/patients/full?cedula=${encodeURIComponent(cedula)}`);
	return raw ? mapPatient(raw) : null;
}

export async function findFullByNHM(nhm: number): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.nhm === nhm) ?? null;
	}
	const raw = await apiFetch<Record<string, unknown> | null>(`/patients/full?nhm=${nhm}`);
	return raw ? mapPatient(raw) : null;
}

export async function getMaxNHM(): Promise<number> {
	if (mockFlags.pacientes) return getNextNHM() - 1;
	const res = await apiFetch<{ max_nhm: number }>('/patients/max-nhm');
	return res.max_nhm;
}

export interface CreatePacienteInput {
	cedula: string;
	nombre: string;
	apellido: string;
	sexo?: Sexo;
	fecha_nacimiento?: string;
	lugar_nacimiento?: string;
	edad?: number;
	estado_civil?: EstadoCivil;
	religion?: string;
	procedencia?: string;
	direccion_habitacion?: string;
	telefono?: string;
	profesion?: string;
	ocupacion_actual?: string;
	direccion_trabajo?: string;
	clasificacion_economica?: string;
	relacion_univ: RelacionUniversidad;
	parentesco?: Parentesco;
	titular_nhm?: number;
	datos_medicos?: DatosMedicos;
	contacto_emergencia?: ContactoEmergencia;
}

export async function createPaciente(input: CreatePacienteInput): Promise<Paciente> {
	if (mockFlags.pacientes) {
		const nhm = getNextNHM();
		const nuevo: Paciente = {
			id: crypto.randomUUID(),
			nhm,
			cedula: input.cedula,
			nombre: input.nombre,
			apellido: input.apellido,
			sexo: input.sexo,
			fecha_nacimiento: input.fecha_nacimiento,
			lugar_nacimiento: input.lugar_nacimiento,
			edad: input.edad,
			estado_civil: input.estado_civil,
			religion: input.religion,
			procedencia: input.procedencia,
			direccion_habitacion: input.direccion_habitacion,
			telefono: input.telefono,
			profesion: input.profesion,
			ocupacion_actual: input.ocupacion_actual,
			direccion_trabajo: input.direccion_trabajo,
			clasificacion_economica: input.clasificacion_economica,
			relacion_univ: input.relacion_univ,
			parentesco: input.parentesco,
			titular_nhm: input.titular_nhm,
			datos_medicos: input.datos_medicos ?? {},
			contacto_emergencia: input.contacto_emergencia,
			es_nuevo: true,
			created_at: new Date().toISOString()
		};
		mockPacientes.push(nuevo);
		return nuevo;
	}
	const backendData = mapPatientToBackend(input as Paciente);
	const raw = await apiFetch<Record<string, unknown>>('/patients', { method: 'POST', body: JSON.stringify(backendData) });
	return mapPatient(raw);
}

/**
 * Registro público de paciente (sin JWT).
 * Usa POST /patients/register que no requiere autenticación.
 * El backend devuelve PatientPublicResponse.
 */
export async function registerPaciente(input: CreatePacienteInput): Promise<PacientePublic> {
	if (mockFlags.pacientes) {
		const created = await createPaciente(input);
		return toPublic(created);
	}
	const backendData = mapPatientToBackend(input as Paciente);
	const raw = await apiFetch<Record<string, unknown>>('/patients/register', { method: 'POST', body: JSON.stringify(backendData) });
	return mapPatientPublic(raw);
}
