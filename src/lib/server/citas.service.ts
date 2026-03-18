import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockCitas, mockCitasConPaciente } from './mock/data.js';
import type { Cita, CitaConPaciente, CitaEstado, AppointmentFilters, PaginatedResponse } from '$shared/types/appointments.js';

export interface CreateCitaInput {
	paciente_id: number;
	doctor_id: number;
	especialidad_id: number;
	fecha: string;
	hora_inicio: string;
	hora_fin: string;
	duracion_min: 30 | 60;
	es_primera_vez: boolean;
	motivo_consulta?: string;
	observaciones?: string;
	created_by: string;
}

export async function createCita(input: CreateCitaInput): Promise<Cita> {
	if (mockFlags.citas) {
		// Verificar doble-booking en mock
		const conflict = mockCitas.find(
			(c) =>
				c.doctor_id === input.doctor_id &&
				c.fecha === input.fecha &&
				c.hora_inicio === input.hora_inicio &&
				c.estado !== 'cancelada'
		);
		if (conflict) throw Object.assign(new Error('Slot ocupado'), { status: 409 });

		const nueva: Cita = {
			id: mockCitas.length + 1,
			...input,
			estado: 'pendiente',
			created_at: new Date().toISOString()
		};
		mockCitas.push(nueva);
		return nueva;
	}
	return apiFetch<Cita>('/citas', { method: 'POST', body: JSON.stringify(input) });
}

export async function getCitasByFilters(
	filters: AppointmentFilters
): Promise<PaginatedResponse<CitaConPaciente>> {
	if (mockFlags.citas) {
		let data = [...mockCitasConPaciente];

		if (filters.fecha) data = data.filter((c) => c.fecha === filters.fecha);
		if (filters.doctorId) data = data.filter((c) => c.doctor_id === filters.doctorId);
		if (filters.especialidadId) data = data.filter((c) => c.especialidad_id === filters.especialidadId);
		if (filters.estado) data = data.filter((c) => c.estado === filters.estado);
		if (filters.search) {
			const q = filters.search.toLowerCase();
			data = data.filter(
				(c) =>
					c.paciente.nombre.toLowerCase().includes(q) ||
					c.paciente.apellido.toLowerCase().includes(q) ||
					c.paciente.cedula.toLowerCase().includes(q)
			);
		}

		const total = data.length;
		const page = filters.page ?? 1;
		const pageSize = filters.pageSize ?? 25;
		const start = (page - 1) * pageSize;
		return {
			data: data.slice(start, start + pageSize),
			total,
			page,
			pageSize,
			hasNext: start + pageSize < total
		};
	}

	const qs = new URLSearchParams();
	if (filters.fecha) qs.set('fecha', filters.fecha);
	if (filters.doctorId) qs.set('doctor_id', String(filters.doctorId));
	if (filters.especialidadId) qs.set('especialidad_id', String(filters.especialidadId));
	if (filters.estado) qs.set('estado', filters.estado);
	if (filters.search) qs.set('q', filters.search);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.pageSize ?? 25));

	return apiFetch<PaginatedResponse<CitaConPaciente>>(`/citas?${qs}`);
}

export async function getCitasHoy(doctorId?: number): Promise<CitaConPaciente[]> {
	const today = new Date().toISOString().slice(0, 10);
	if (mockFlags.citas) {
		return mockCitasConPaciente.filter(
			(c) => c.fecha === today && (!doctorId || c.doctor_id === doctorId)
		);
	}
	const qs = new URLSearchParams({ fecha: today });
	if (doctorId) qs.set('doctor_id', String(doctorId));
	return apiFetch<CitaConPaciente[]>(`/citas?${qs}`);
}

export async function getCitasByDoctorMes(doctorId: number, year: number, month: number): Promise<Cita[]> {
	const prefix = `${year}-${String(month).padStart(2, '0')}`;
	if (mockFlags.citas) {
		return mockCitas.filter(
			(c) => c.doctor_id === doctorId && c.fecha.startsWith(prefix) && c.estado !== 'cancelada'
		);
	}
	return apiFetch<Cita[]>(`/citas?doctor_id=${doctorId}&mes=${prefix}&excluir_canceladas=true`);
}

export async function getCitasByDoctorFecha(doctorId: number, fecha: string): Promise<Cita[]> {
	if (mockFlags.citas) {
		return mockCitas.filter(
			(c) => c.doctor_id === doctorId && c.fecha === fecha && c.estado !== 'cancelada'
		);
	}
	return apiFetch<Cita[]>(`/citas?doctor_id=${doctorId}&fecha=${fecha}&excluir_canceladas=true`);
}

export async function getCitaById(id: number): Promise<CitaConPaciente | null> {
	if (mockFlags.citas) {
		return mockCitasConPaciente.find((c) => c.id === id) ?? null;
	}
	return apiFetch<CitaConPaciente>(`/citas/${id}`);
}

export async function updateEstadoCita(id: number, estado: CitaEstado): Promise<void> {
	if (mockFlags.citas) {
		const c = mockCitas.find((x) => x.id === id);
		if (c) c.estado = estado;
		return;
	}
	await apiFetch(`/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
}

export async function isSlotOccupied(doctorId: number, fecha: string, horaInicio: string): Promise<boolean> {
	if (mockFlags.citas) {
		return mockCitas.some(
			(c) =>
				c.doctor_id === doctorId &&
				c.fecha === fecha &&
				c.hora_inicio === horaInicio &&
				c.estado !== 'cancelada'
		);
	}
	const res = await apiFetch<{ ocupado: boolean }>(
		`/citas/check-slot?doctor_id=${doctorId}&fecha=${fecha}&hora_inicio=${horaInicio}`
	);
	return res.ocupado;
}
