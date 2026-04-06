import type { PageServerLoad } from './$types';
import * as doctoresService from '$lib/server/staff/doctors.service.js';
import * as citasService from '$lib/server/appointments/appointments.service.js';
import type { DisponibilidadDoctor } from '$domain/staff/types.js';

export const load: PageServerLoad = async () => {
	const [doctores, especialidades, stats] = await Promise.all([
		doctoresService.getActiveDoctores(),
		doctoresService.getEspecialidades(),
		citasService.getStats({ page_size: 10_000 })
	]);

	// Disponibilidad de todos los doctores
	const disponibilidadPorDoctor = await Promise.all(
		doctores.map(async (doc) => ({
			doctor_id: doc.id,
			bloques: await doctoresService.getAllDisponibilidad(doc.id)
		}))
	);

	const disponibilidadMap: Record<string, DisponibilidadDoctor[]> = {};
	for (const { doctor_id, bloques } of disponibilidadPorDoctor) {
		disponibilidadMap[doctor_id] = bloques;
	}

	// ── Métricas cruzadas oferta vs demanda ──

	// a) Tasa de ocupación por especialidad
	const ocupacionPorEspecialidad: { nombre: string; slotsDisponibles: number; slotsReservados: number }[] = [];
	for (const esp of especialidades) {
		const docsEsp = doctores.filter((d) => d.especialidad_id === esp.id);
		let slotsDisponibles = 0;
		for (const doc of docsEsp) {
			const bloques = disponibilidadMap[doc.id] ?? [];
			for (const b of bloques) {
				const [hi, mi] = b.hora_inicio.split(':').map(Number);
				const [hf, mf] = b.hora_fin.split(':').map(Number);
				slotsDisponibles += Math.floor(((hf * 60 + mf) - (hi * 60 + mi)) / (b.duracion_slot || 30));
			}
		}
		// slots por semana → multiplicar por 4 para mes aprox
		const slotsSemanales = slotsDisponibles;
		const citasEsp = stats.bySpecialty.find((s) => s.name === esp.nombre);
		ocupacionPorEspecialidad.push({
			nombre: esp.nombre,
			slotsDisponibles: slotsSemanales,
			slotsReservados: citasEsp?.count ?? 0
		});
	}

	// b) Heatmap: citas por día de semana × hora
	const { items: todasCitas } = await citasService.getCitasByFilters({ page_size: 10_000 });
	const heatmap: number[][] = Array.from({ length: 5 }, () => Array(12).fill(0)); // 5 días × 12 horas (07-18)
	for (const c of todasCitas) {
		const d = new Date(c.fecha + 'T12:00:00');
		const dow = d.getDay(); // 0=Dom
		if (dow === 0 || dow === 6) continue;
		const dayIdx = dow - 1; // 0=Lun
		const hora = parseInt(c.hora_inicio.split(':')[0], 10);
		const horaIdx = hora - 7;
		if (horaIdx >= 0 && horaIdx < 12) {
			heatmap[dayIdx][horaIdx]++;
		}
	}

	// d) Ausentismo por especialidad
	const ausentismoPorEspecialidad: { nombre: string; total: number; noShows: number; tasa: number }[] = [];
	for (const esp of especialidades) {
		const citasEsp = todasCitas.filter((c) => c.especialidad_id === esp.id);
		const total = citasEsp.length;
		const noShows = citasEsp.filter((c) => c.estado === 'no_asistio').length;
		if (total > 0) {
			ausentismoPorEspecialidad.push({
				nombre: esp.nombre,
				total,
				noShows,
				tasa: Math.round((noShows / total) * 100)
			});
		}
	}
	ausentismoPorEspecialidad.sort((a, b) => b.tasa - a.tasa);

	return {
		doctores,
		especialidades,
		disponibilidadMap,
		stats,
		ocupacionPorEspecialidad,
		heatmap,
		ausentismoPorEspecialidad
	};
};
