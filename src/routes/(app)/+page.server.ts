import type { PageServerLoad } from './$types';
import * as citasService from '$lib/server/citas.service.js';
import * as doctoresService from '$lib/server/doctores.service.js';
import * as pacientesService from '$lib/server/pacientes.service.js';
import * as historiasService from '$lib/server/historias.service.js';
import * as prescriptionsService from '$lib/server/inventory/prescriptions.service.js';
import * as reportsService from '$lib/server/inventory/reports.service.js';
import { mockHistorias } from '$lib/server/mock/data.js';
import { mockDisponibilidad } from '$lib/server/mock/data.js';

// Defaults seguros para cuando un servicio falla
const emptyStats = { total: 0, byStatus: {} as Record<string, number>, bySpecialty: [] as { name: string; count: number }[], byDoctor: [] as { name: string; specialty: string; count: number; atendidas: number }[], firstTimeCount: 0, returningCount: 0, byPatientType: {} as Record<string, number>, dailyTrend: [] as number[], peakHours: [] as { hour: string; count: number }[] };
const emptyStockReport = { generated_at: '', items: [], total_medications: 0, critical_count: 0, expired_count: 0 };
const emptyExpReport = { generated_at: '', threshold_days: 90, batches: [] };
const emptyConsumption = { period: '', items: [] };

export const load: PageServerLoad = async () => {
	const hoy = new Date().toISOString().slice(0, 10);
	const mesActual = hoy.slice(0, 7);

	// Cada llamada es independiente — si una falla, las demás siguen
	const [
		statsGlobal,
		citasHoy,
		doctores,
		especialidades,
		pacientes,
		stockReport,
		expirationReport,
		consumptionReport
	] = await Promise.all([
		citasService.getStats({ page_size: 10_000 }).catch(() => emptyStats),
		citasService.getCitasHoy().catch(() => []),
		doctoresService.getActiveDoctores().catch(() => []),
		doctoresService.getEspecialidades().catch(() => []),
		pacientesService.getAllPacientes().catch(() => []),
		reportsService.getStockReport().catch(() => emptyStockReport),
		reportsService.getExpirationReport(90).catch(() => emptyExpReport),
		reportsService.getConsumptionReport(mesActual).catch(() => emptyConsumption)
	]);

	// ── Métricas de pacientes ──
	const pacientesPorTipo: Record<string, number> = {};
	const pacientesPorSexo: Record<string, number> = { M: 0, F: 0 };
	for (const p of pacientes) {
		pacientesPorTipo[p.relacion_univ] = (pacientesPorTipo[p.relacion_univ] ?? 0) + 1;
		if (p.sexo) pacientesPorSexo[p.sexo]++;
	}
	const pacientesNuevos = pacientes.filter((p) => p.es_nuevo).length;

	// ── Diagnósticos más frecuentes ──
	const dxMap = new Map<string, { cie10: string; descripcion: string; count: number }>();
	for (const h of mockHistorias) {
		const dx = h.evaluacion?.diagnostico;
		if (dx?.descripcion) {
			const key = dx.cie10 || dx.descripcion;
			const existing = dxMap.get(key);
			if (existing) existing.count++;
			else dxMap.set(key, { cie10: dx.cie10 ?? '', descripcion: dx.descripcion, count: 1 });
		}
	}
	const topDiagnosticos = [...dxMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

	// ── Ocupación por especialidad ──
	const ocupacionPorEspecialidad: { nombre: string; slotsDisponibles: number; citasAgendadas: number }[] = [];
	for (const esp of especialidades) {
		const docsEsp = doctores.filter((d) => d.especialidad_id === esp.id);
		let slotsDisponibles = 0;
		for (const doc of docsEsp) {
			const bloques = mockDisponibilidad.filter((b) => b.doctor_id === doc.id);
			for (const b of bloques) {
				const [hi, mi] = b.hora_inicio.split(':').map(Number);
				const [hf, mf] = b.hora_fin.split(':').map(Number);
				slotsDisponibles += Math.floor(((hf * 60 + mf) - (hi * 60 + mi)) / (b.duracion_slot || 30));
			}
		}
		const citasEsp = statsGlobal.bySpecialty.find((s) => s.name === esp.nombre);
		ocupacionPorEspecialidad.push({
			nombre: esp.nombre,
			slotsDisponibles,
			citasAgendadas: citasEsp?.count ?? 0
		});
	}

	// ── Heatmap citas por día×hora ──
	const { items: todasCitas } = await citasService.getCitasByFilters({ page_size: 10_000 }).catch(() => ({ items: [] as import('$shared/types/appointments.js').CitaConPaciente[], pagination: { total: 0, page: 1, page_size: 10000, pages: 0, has_next: false } }));
	const heatmap: number[][] = Array.from({ length: 5 }, () => Array(12).fill(0));
	for (const c of todasCitas) {
		const d = new Date(c.fecha + 'T12:00:00');
		const dow = d.getDay();
		if (dow === 0 || dow === 6) continue;
		const dayIdx = dow - 1;
		const hora = parseInt(c.hora_inicio.split(':')[0], 10);
		const horaIdx = hora - 7;
		if (horaIdx >= 0 && horaIdx < 12) heatmap[dayIdx][horaIdx]++;
	}

	// ── Ausentismo por especialidad ──
	const ausentismoPorEspecialidad: { nombre: string; total: number; noShows: number; tasa: number }[] = [];
	for (const esp of especialidades) {
		const citasEsp = todasCitas.filter((c) => c.especialidad_id === esp.id);
		const total = citasEsp.length;
		const noShows = citasEsp.filter((c) => c.estado === 'no_asistio').length;
		if (total > 0) {
			ausentismoPorEspecialidad.push({ nombre: esp.nombre, total, noShows, tasa: Math.round((noShows / total) * 100) });
		}
	}
	ausentismoPorEspecialidad.sort((a, b) => b.tasa - a.tasa);

	// ── Recetas ──
	const recetasPendientes = todasCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;

	// ── Valor inventario estimado ──
	let valorInventario = 0;
	for (const item of stockReport.items) {
		valorInventario += item.total_available * 5; // estimado unit cost
	}

	return {
		hoy,
		statsGlobal,
		citasHoy: citasHoy.length,
		totalDoctores: doctores.length,
		totalPacientes: pacientes.length,
		pacientesNuevos,
		pacientesPorTipo,
		pacientesPorSexo,
		topDiagnosticos,
		stockReport,
		expirationReport,
		consumptionReport,
		ocupacionPorEspecialidad,
		heatmap,
		ausentismoPorEspecialidad,
		recetasPendientes,
		valorInventario
	};
};
