import { mockFlags } from './mock-flags.js';
import { apiFetch } from './api.js';
import { mockCitas, mockCitasConPaciente } from './mock/data.js';
import type { Cita, CitaConPaciente, CitaEstado, AppointmentFilters, PaginatedResponse } from '$shared/types/appointments.js';
import { mapAppointment, mapAppointmentToBackend, mapStatusToBackend, mapPagination } from './mappers.js';

type R = Record<string, unknown>;

export interface CreateCitaInput {
	paciente_id: string;
	doctor_id: string;
	especialidad_id: string;
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
			id: crypto.randomUUID(),
			...input,
			estado: 'pendiente',
			created_at: new Date().toISOString()
		};
		mockCitas.push(nueva);
		return nueva;
	}
	const backendData = mapAppointmentToBackend(input);
	const raw = await apiFetch<R>('/appointments', { method: 'POST', body: JSON.stringify(backendData) });
	return mapAppointment(raw) as Cita;
}

export async function getCitasByFilters(
	filters: AppointmentFilters
): Promise<PaginatedResponse<CitaConPaciente>> {
	if (mockFlags.citas) {
		let data = [...mockCitasConPaciente];

		if (filters.fecha) data = data.filter((c) => c.fecha === filters.fecha);
		if (filters.doctor_id) data = data.filter((c) => c.doctor_id === filters.doctor_id);
		if (filters.especialidad_id) data = data.filter((c) => c.especialidad_id === filters.especialidad_id);
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
		const page_size = filters.page_size ?? 25;
		const start = (page - 1) * page_size;
		return {
			items: data.slice(start, start + page_size),
			pagination: {
				total,
				page,
				page_size,
				pages: Math.ceil(total / page_size),
				has_next: start + page_size < total
			}
		};
	}

	const qs = new URLSearchParams();
	if (filters.fecha) qs.set('fecha', filters.fecha);
	if (filters.doctor_id) qs.set('doctor_id', filters.doctor_id);
	if (filters.especialidad_id) qs.set('especialidad_id', filters.especialidad_id);
	if (filters.estado) qs.set('estado', filters.estado);
	if (filters.search) qs.set('q', filters.search);
	qs.set('page', String(filters.page ?? 1));
	qs.set('page_size', String(filters.page_size ?? 25));

	const raw = await apiFetch<R>(`/appointments?${qs}`);
	const page = mapPagination(raw);
	return {
		items: (page.items as R[]).map(mapAppointment),
		pagination: page.pagination
	};
}

export async function getCitasByPatientId(patientId: string): Promise<{ items: CitaConPaciente[]; pagination: { total: number; page: number; page_size: number; pages: number; has_next: boolean } }> {
	if (mockFlags.citas) {
		const citas = mockCitasConPaciente.filter((c) => c.paciente_id === patientId);
		return { items: citas, pagination: { total: citas.length, page: 1, page_size: 100, pages: 1, has_next: false } };
	}
	const raw = await apiFetch<R>(`/appointments?fk_patient_id=${patientId}&page_size=100`);
	if (Array.isArray(raw)) {
		const items = (raw as R[]).map(mapAppointment);
		return { items, pagination: { total: items.length, page: 1, page_size: 100, pages: 1, has_next: false } };
	}
	const page = mapPagination(raw);
	return { items: (page.items as R[]).map(mapAppointment), pagination: page.pagination };
}

export async function getCitasHoy(doctorId?: string): Promise<CitaConPaciente[]> {
	const today = new Date().toISOString().slice(0, 10);
	if (mockFlags.citas) {
		return mockCitasConPaciente.filter(
			(c) => c.fecha === today && (!doctorId || c.doctor_id === doctorId)
		);
	}
	const qs = new URLSearchParams({ fecha: today });
	if (doctorId) qs.set('doctor_id', doctorId);
	const raw = await apiFetch<R | R[]>(`/appointments?${qs}`);
	const items = Array.isArray(raw) ? raw : (raw.items as R[] ?? []);
	return items.map(mapAppointment);
}

export async function getCitasByDoctorMes(doctorId: string, year: number, month: number): Promise<Cita[]> {
	const prefix = `${year}-${String(month).padStart(2, '0')}`;
	if (mockFlags.citas) {
		return mockCitas.filter(
			(c) => c.doctor_id === doctorId && c.fecha.startsWith(prefix) && c.estado !== 'cancelada'
		);
	}
	const raw = await apiFetch<R | R[]>(`/appointments?doctor_id=${doctorId}&mes=${prefix}&excluir_canceladas=true`);
	// Backend puede devolver array directo o paginado
	const items = Array.isArray(raw) ? raw : (raw.items as R[] ?? []);
	return items.map((r) => mapAppointment(r) as Cita);
}

export async function getCitasByDoctorFecha(doctorId: string, fecha: string): Promise<Cita[]> {
	if (mockFlags.citas) {
		return mockCitas.filter(
			(c) => c.doctor_id === doctorId && c.fecha === fecha && c.estado !== 'cancelada'
		);
	}
	const raw = await apiFetch<R | R[]>(`/appointments?doctor_id=${doctorId}&fecha=${fecha}&excluir_canceladas=true`);
	const items = Array.isArray(raw) ? raw : (raw.items as R[] ?? []);
	return items.map((r) => mapAppointment(r) as Cita);
}

export async function getCitaById(id: string): Promise<CitaConPaciente | null> {
	if (mockFlags.citas) {
		return mockCitasConPaciente.find((c) => c.id === id) ?? null;
	}
	const raw = await apiFetch<R>(`/appointments/${id}`);
	return mapAppointment(raw);
}

export async function updateEstadoCita(id: string, estado: CitaEstado): Promise<void> {
	if (mockFlags.citas) {
		const c = mockCitas.find((x) => x.id === id);
		if (c) c.estado = estado;
		return;
	}
	await apiFetch(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ new_status: mapStatusToBackend(estado) }) });
}

// ─── Estadísticas para dashboard del analista ────────────────

export interface CitasStats {
	total: number;
	byStatus: Record<string, number>;
	bySpecialty: { name: string; count: number }[];
	byDoctor: { name: string; specialty: string; count: number; atendidas: number }[];
	firstTimeCount: number;
	returningCount: number;
	byPatientType: Record<string, number>;
	/** Citas agrupadas por día (últimos 7 días con data) para sparkline */
	dailyTrend: number[];
	/** Hora pico: distribución por franja horaria */
	peakHours: { hour: string; count: number }[];
}

export async function getStats(filters: AppointmentFilters): Promise<CitasStats> {
	if (mockFlags.citas) {
		let data = [...mockCitasConPaciente];

		// Aplicar mismos filtros que la tabla (excepto paginación)
		if (filters.fecha) data = data.filter((c) => c.fecha === filters.fecha);
		if (filters.doctor_id) data = data.filter((c) => c.doctor_id === filters.doctor_id);
		if (filters.especialidad_id) data = data.filter((c) => c.especialidad_id === filters.especialidad_id);
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

		// Por estado
		const byStatus: Record<string, number> = {};
		for (const c of data) {
			byStatus[c.estado] = (byStatus[c.estado] ?? 0) + 1;
		}

		// Por especialidad
		const specMap = new Map<string, number>();
		for (const c of data) {
			const name = c.doctor?.especialidad?.nombre ?? 'Sin especialidad';
			specMap.set(name, (specMap.get(name) ?? 0) + 1);
		}
		const bySpecialty = [...specMap.entries()]
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);

		// Por doctor
		const docMap = new Map<string, { name: string; specialty: string; count: number; atendidas: number }>();
		for (const c of data) {
			const key = c.doctor_id;
			const existing = docMap.get(key);
			if (existing) {
				existing.count++;
				if (c.estado === 'atendida') existing.atendidas++;
			} else {
				docMap.set(key, {
					name: `Dr. ${c.doctor?.apellido ?? 'N/A'}`,
					specialty: c.doctor?.especialidad?.nombre ?? '',
					count: 1,
					atendidas: c.estado === 'atendida' ? 1 : 0
				});
			}
		}
		const byDoctor = [...docMap.values()].sort((a, b) => b.count - a.count);

		// Primera vez vs retorno
		const firstTimeCount = data.filter((c) => c.es_primera_vez).length;
		const returningCount = data.length - firstTimeCount;

		// Por tipo de paciente (relación universitaria)
		const byPatientType: Record<string, number> = {};
		for (const c of data) {
			const tipo = c.paciente?.relacion_univ ?? 'desconocido';
			byPatientType[tipo] = (byPatientType[tipo] ?? 0) + 1;
		}

		// Tendencia diaria (agrupado por fecha)
		const dateMap = new Map<string, number>();
		for (const c of data) {
			dateMap.set(c.fecha, (dateMap.get(c.fecha) ?? 0) + 1);
		}
		const sortedDates = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
		const dailyTrend = sortedDates.map(([, count]) => count);

		// Distribución por hora
		const hourMap = new Map<string, number>();
		for (const c of data) {
			const hour = c.hora_inicio.split(':')[0] + ':00';
			hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
		}
		const peakHours = [...hourMap.entries()]
			.map(([hour, count]) => ({ hour, count }))
			.sort((a, b) => a.hour.localeCompare(b.hour));

		return {
			total: data.length,
			byStatus,
			bySpecialty,
			byDoctor,
			firstTimeCount,
			returningCount,
			byPatientType,
			dailyTrend,
			peakHours
		};
	}

	// API real — el backend debería tener un endpoint /appointments/stats
	const qs = new URLSearchParams();
	if (filters.fecha) qs.set('fecha', filters.fecha);
	if (filters.doctor_id) qs.set('doctor_id', filters.doctor_id);
	if (filters.especialidad_id) qs.set('especialidad_id', filters.especialidad_id);
	if (filters.estado) qs.set('estado', filters.estado);
	return apiFetch<CitasStats>(`/appointments/stats?${qs}`);
}

export async function isSlotOccupied(doctorId: string, fecha: string, horaInicio: string): Promise<boolean> {
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
		`/appointments/check-slot?doctor_id=${doctorId}&fecha=${fecha}&hora_inicio=${horaInicio}`
	);
	return res.ocupado;
}
