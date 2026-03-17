import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockPacientes, getNextNHM } from './mock/data.js';
import type { Paciente, PacientePublic, DatosMedicos, RelacionUniversidad, Parentesco } from '$shared/types/appointments.js';

function toPublic(p: Paciente): PacientePublic {
	return { id: p.id, nhm: p.nhm, nombre: p.nombre, apellido: p.apellido, relacion_univ: p.relacion_univ, es_nuevo: p.es_nuevo };
}

export async function findByNHM(nhm: number): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.nhm === nhm);
		return p ? toPublic(p) : null;
	}
	return apiFetch<PacientePublic | null>(`/pacientes?nhm=${nhm}`);
}

export async function findByCedula(cedula: string): Promise<PacientePublic | null> {
	if (mockFlags.pacientes) {
		const p = mockPacientes.find((x) => x.cedula === cedula);
		return p ? toPublic(p) : null;
	}
	return apiFetch<PacientePublic | null>(`/pacientes?cedula=${encodeURIComponent(cedula)}`);
}

export async function findFullByCedula(cedula: string): Promise<Paciente | null> {
	if (mockFlags.pacientes) {
		return mockPacientes.find((x) => x.cedula === cedula) ?? null;
	}
	return apiFetch<Paciente | null>(`/pacientes/full?cedula=${encodeURIComponent(cedula)}`);
}

export async function getMaxNHM(): Promise<number> {
	if (mockFlags.pacientes) return getNextNHM() - 1;
	const res = await apiFetch<{ max_nhm: number }>('/pacientes/max-nhm');
	return res.max_nhm;
}

export interface CreatePacienteInput {
	cedula: string;
	nombre: string;
	apellido: string;
	relacion_univ: RelacionUniversidad;
	parentesco?: Parentesco;
	titular_nhm?: number;
	datos_medicos: DatosMedicos;
}

export async function createPaciente(input: CreatePacienteInput): Promise<Paciente> {
	if (mockFlags.pacientes) {
		const nhm = getNextNHM();
		const nuevo: Paciente = {
			id: mockPacientes.length + 1,
			nhm,
			cedula: input.cedula,
			nombre: input.nombre,
			apellido: input.apellido,
			relacion_univ: input.relacion_univ,
			parentesco: input.parentesco,
			titular_nhm: input.titular_nhm,
			datos_medicos: input.datos_medicos,
			es_nuevo: true,
			created_at: new Date().toISOString()
		};
		mockPacientes.push(nuevo);
		return nuevo;
	}
	return apiFetch<Paciente>('/pacientes', { method: 'POST', body: JSON.stringify(input) });
}
