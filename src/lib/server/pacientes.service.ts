import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockPacientes, getNextNHM } from './mock/data.js';
import type { Paciente, PacientePublic, DatosMedicos, RelacionUniversidad, Parentesco, Sexo, EstadoCivil, ContactoEmergencia } from '$shared/types/appointments.js';

function toPublic(p: Paciente): PacientePublic {
	return { id: p.id, nhm: p.nhm, nombre: p.nombre, apellido: p.apellido, relacion_univ: p.relacion_univ, es_nuevo: p.es_nuevo };
}

export async function findByNHM(nhm: number): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.nhm === nhm);
		return p ? toPublic(p) : null;
	}
	return apiFetch<PacientePublic | null>(`/patients?nhm=${nhm}`);
}

export async function findByCedula(cedula: string): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.cedula === cedula);
		return p ? toPublic(p) : null;
	}
	return apiFetch<PacientePublic | null>(`/patients?cedula=${encodeURIComponent(cedula)}`);
}

export async function findFullByCedula(cedula: string): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.cedula === cedula) ?? null;
	}
	return apiFetch<Paciente | null>(`/patients/full?cedula=${encodeURIComponent(cedula)}`);
}

export async function findFullByNHM(nhm: number): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.nhm === nhm) ?? null;
	}
	return apiFetch<Paciente | null>(`/patients/full?nhm=${nhm}`);
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
	datos_medicos: DatosMedicos;
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
			datos_medicos: input.datos_medicos,
			contacto_emergencia: input.contacto_emergencia,
			es_nuevo: true,
			created_at: new Date().toISOString()
		};
		mockPacientes.push(nuevo);
		return nuevo;
	}
	return apiFetch<Paciente>('/patients', { method: 'POST', body: JSON.stringify(input) });
}
