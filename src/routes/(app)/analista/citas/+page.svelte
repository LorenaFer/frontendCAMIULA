<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AppointmentFilters as AppointmentFiltersType, CitaConPaciente } from '$shared/types/appointments.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	type CitaRow = CitaConPaciente & Record<string, unknown>;
	import AppointmentFilters from '$shared/components/appointments/AppointmentFilters.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Sparkline from '$shared/components/sparkline/Sparkline.svelte';
	import DoctorAvailabilityCalendar from '$shared/components/appointments/DoctorAvailabilityCalendar.svelte';
	import TimeSlotPicker from '$shared/components/appointments/TimeSlotPicker.svelte';
	import type { TimeSlot, DoctorOption } from '$shared/types/appointments.js';
	import { enhance, deserialize } from '$app/forms';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data }: { data: PageData } = $props();

	let showBreakdown = $state(false);

	function applyFilters(filters: AppointmentFiltersType) {
		const qs = new URLSearchParams();
		if (filters.fecha) qs.set('fecha', filters.fecha);
		if (filters.doctor_id) qs.set('doctor_id', String(filters.doctor_id));
		if (filters.especialidad_id) qs.set('especialidad_id', String(filters.especialidad_id));
		if (filters.estado) qs.set('estado', filters.estado);
		if (filters.search) qs.set('search', filters.search);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		if (ps) qs.set('page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	function changePageSize(size: number) {
		changePage(1, size);
	}

	const pagination = $derived(data.citas.pagination);
	const pageSizeOptions = [10, 25, 50, 100];

	// ─── Métricas derivadas ──────────────────────────────────
	const stats = $derived(data.stats);

	const atendidas = $derived(stats.byStatus['atendida'] ?? 0);
	const noAsistio = $derived(stats.byStatus['no_asistio'] ?? 0);
	const canceladas = $derived(stats.byStatus['cancelada'] ?? 0);
	const pendientes = $derived(stats.byStatus['pendiente'] ?? 0);
	const confirmadas = $derived(stats.byStatus['confirmada'] ?? 0);

	const completionRate = $derived(
		stats.total > 0 ? Math.round((atendidas / stats.total) * 100) : 0
	);
	const noShowRate = $derived(
		stats.total > 0 ? Math.round((noAsistio / stats.total) * 100) : 0
	);
	const cancellationRate = $derived(
		stats.total > 0 ? Math.round((canceladas / stats.total) * 100) : 0
	);
	const firstTimeRate = $derived(
		stats.total > 0 ? Math.round((stats.firstTimeCount / stats.total) * 100) : 0
	);

	const patientTypeLabels: Record<string, string> = {
		P: 'Profesores', E: 'Empleados', O: 'Obreros', B: 'Estudiantes',
		F: 'Familiares', X: 'Caso Especial',
		C: 'Fam. Estudiante', R: 'Fam. Profesor', S: 'Fam. Empleado', T: 'Fam. Obrero',
		empleado: 'Empleados', estudiante: 'Estudiantes', profesor: 'Profesores', tercero: 'Terceros'
	};

	// ─── Datos derivados para BI ─────────────────────────────
	const statusColors: Record<string, string> = {
		pendiente: 'bg-amber-400', confirmada: 'bg-viking-400',
		atendida: 'bg-emerald-500', cancelada: 'bg-red-400', no_asistio: 'bg-slate-400'
	};
	const statusLabels: Record<string, string> = {
		pendiente: 'Pendiente', confirmada: 'Confirmada',
		atendida: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No asistió'
	};
	const statusEntries = $derived(
		Object.entries(stats.byStatus)
			.filter(([, v]) => v > 0)
			.sort(([, a], [, b]) => b - a)
	);

	// Sorted patient types by count
	const sortedPatientTypes = $derived(
		Object.entries(stats.byPatientType)
			.filter(([, v]) => v > 0)
			.sort(([, a], [, b]) => b - a)
	);
	const maxPatientTypeCount = $derived(
		sortedPatientTypes.length > 0 ? sortedPatientTypes[0][1] : 1
	);

	// Agrupar peakHours por hora (el backend devuelve minutos exactos como 09:00, 09:37, 10:28...)
	const hourlyDistribution = $derived.by(() => {
		const byHour = new Map<number, number>();
		for (const h of stats.peakHours) {
			const hour = parseInt(h.hour.split(':')[0], 10);
			byHour.set(hour, (byHour.get(hour) ?? 0) + h.count);
		}
		// Generar rango completo 7-18
		const result: { hour: number; label: string; count: number }[] = [];
		for (let h = 7; h <= 18; h++) {
			result.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, count: byHour.get(h) ?? 0 });
		}
		return result;
	});
	const hourlyMax = $derived(Math.max(...hourlyDistribution.map(h => h.count), 1));

	const donutColorMap: Record<string, string> = {
		pendiente: '#fbbf24', confirmada: '#38b2ac',
		atendida: '#10b981', cancelada: '#f87171', no_asistio: '#94a3b8'
	};
	const donutSegments = $derived(
		statusEntries.map(([status, count]) => ({
			status, count,
			pct: stats.total > 0 ? (count / stats.total) * 100 : 0,
			stroke: donutColorMap[status] ?? '#94a3b8',
			dotColor: statusColors[status] ?? 'bg-slate-300'
		}))
	);

	const topSpecialty = $derived(stats.bySpecialty[0]?.name ?? '—');
	const peakHour = $derived.by(() => {
		const peak = hourlyDistribution.reduce((a, b) => (b.count > a.count ? b : a), hourlyDistribution[0]);
		return peak && peak.count > 0 ? peak.label : '—';
	});

	function exportar() {
		const qs = new URLSearchParams($page.url.searchParams);
		window.location.href = `?/exportarExcel&${qs}`;
	}

	function formatFecha(fecha: string) {
		const [y, m, d] = fecha.split('-');
		return `${d}/${m}/${y}`;
	}

	let viewingCita = $state<CitaConPaciente | null>(null);
	let cancellingCita = $state<CitaConPaciente | null>(null);

	// Reagendamiento
	let reschedulingCita = $state<CitaConPaciente | null>(null);
	let rescheduleDate = $state('');
	let rescheduleSlots = $state<TimeSlot[]>([]);
	let rescheduleSelectedSlot = $state('');
	let rescheduleSlotDuracion = $state<30 | 60>(30);
	let rescheduleLoadingSlots = $state(false);

	const rescheduleMinDate = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + 2);
		return d.toISOString().slice(0, 10);
	});

	const rescheduleDoctor = $derived(
		reschedulingCita ? data.doctores.find((d: DoctorOption) => d.id === reschedulingCita!.doctor_id) ?? null : null
	);

	const rescheduleAvailableDates = $derived.by(() => {
		if (!rescheduleDoctor || !rescheduleDoctor.dias_trabajo?.length) return [];
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const daysInMonth = new Date(year, month, 0).getDate();
		const mo = String(month).padStart(2, '0');
		const minD = rescheduleMinDate();
		const dates: string[] = [];
		for (let d = 1; d <= daysInMonth; d++) {
			const fecha = `${year}-${mo}-${String(d).padStart(2, '0')}`;
			if (fecha < minD) continue;
			const dow = new Date(fecha + 'T12:00:00').getDay();
			const dayOfWeek = dow === 0 ? 7 : dow;
			if (rescheduleDoctor.dias_trabajo.includes(dayOfWeek)) dates.push(fecha);
		}
		return dates;
	});

	async function loadRescheduleSlots(date: string) {
		rescheduleDate = date;
		rescheduleSelectedSlot = '';
		rescheduleSlots = [];
		if (!reschedulingCita) return;

		rescheduleLoadingSlots = true;
		try {
			const fd = new FormData();
			fd.set('doctorId', reschedulingCita.doctor_id);
			fd.set('fecha', date);
			fd.set('esNuevo', String(reschedulingCita.es_primera_vez));
			const res = await fetch('?/obtenerSlots', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'success' && result.data) {
				const d = result.data as Record<string, unknown>;
				rescheduleSlots = (d.slots as TimeSlot[]) ?? [];
				rescheduleSlotDuracion = (d.duracion as 30 | 60) ?? 30;
			}
		} catch { /* ignore */ } finally {
			rescheduleLoadingSlots = false;
		}
	}

	const citaMenu: RowMenuItem<CitaRow>[] = [
		{ label: 'Ver detalle', icon: 'view', onclick: (row) => { viewingCita = { ...row } as unknown as CitaConPaciente; } },
		{ label: 'Cancelar cita', icon: 'delete', variant: 'danger', onclick: (row) => {
			const cita = row as unknown as CitaConPaciente;
			if (cita.estado === 'pendiente' || cita.estado === 'confirmada') {
				cancellingCita = { ...cita };
			}
		}}
	];
</script>

{#snippet paginationBar()}
	{#if pagination.pages > 1 || pagination.page_size !== 25}
		<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30">
			<div class="flex items-center gap-3">
				<p class="text-xs text-ink-muted">
					{((pagination.page - 1) * pagination.page_size) + 1}–{Math.min(pagination.page * pagination.page_size, pagination.total)} de {pagination.total}
				</p>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select
						class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={pagination.page_size}
						onchange={(e) => changePageSize(Number((e.target as HTMLSelectElement).value))}
					>
						{#each pageSizeOptions as size}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<button type="button" disabled={pagination.page <= 1} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page - 1)}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
				</button>
				{#each Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
					const start = Math.max(1, Math.min(pagination.page - 3, pagination.pages - 6));
					return start + i;
				}) as p}
					<button type="button" class="w-7 h-7 rounded-md text-xs font-medium transition-colors {p === pagination.page ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}" onclick={() => changePage(p)}>
						{p}
					</button>
				{/each}
				<button type="button" disabled={!pagination.has_next} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changePage(pagination.page + 1)}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
				</button>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet pacienteCell(_v: unknown, row: CitaRow)}
	<div class="flex items-center gap-2.5">
		<div class="w-8 h-8 rounded-full bg-viking-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
			{row.paciente.nombre[0]}{row.paciente.apellido[0]}
		</div>
		<div class="min-w-0">
			<p class="font-medium text-ink truncate">
				{row.paciente.nombre} {row.paciente.apellido}
				{#if row.es_primera_vez}<span class="ml-1 text-xs text-viking-600 font-semibold">★ 1ra</span>{/if}
			</p>
			<p class="text-xs text-ink-muted">NHM {row.paciente.nhm}</p>
		</div>
	</div>
{/snippet}

{#snippet doctorCell(_v: unknown, row: CitaRow)}
	<div>
		<p class="font-medium text-ink">Dr. {row.doctor.apellido}</p>
		<p class="text-xs text-ink-muted">{row.doctor.especialidad?.nombre ?? '—'}</p>
	</div>
{/snippet}

{#snippet fechaCell(v: unknown)}
	<span class="font-mono text-sm">{formatFecha(String(v))}</span>
{/snippet}

{#snippet estadoCell(_v: unknown, row: CitaRow)}
	<AppointmentStatusBadge status={row.estado} />
{/snippet}


<!-- Sparkline snippets para StatCards -->
{#snippet trendSparkline()}
	{#if stats.dailyTrend.length >= 2}
		<Sparkline data={stats.dailyTrend} color="blue" />
	{/if}
{/snippet}

{#snippet noShowSparkBars()}
	{#if stats.peakHours.length >= 2}
		<Sparkline data={stats.peakHours.map(h => h.count)} variant="bars" color="warning" />
	{/if}
{/snippet}

<svelte:head>
	<title>Gestión de Citas — Analista</title>
</svelte:head>

<div class="space-y-4 sm:space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Gestión de Citas</h1>
			<p class="text-xs text-ink-muted mt-0.5">Vista de Analista</p>
		</div>
		<Button variant="ghost" size="sm" onclick={exportar}>Exportar CSV</Button>
	</div>

	<!-- KPI Cards — Fila principal -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<StatCard
			title="Total Citas"
			value={stats.total}
			subtitle={pendientes + confirmadas > 0 ? `${pendientes + confirmadas} en agenda` : undefined}
			accent="viking"
			visualization={trendSparkline}
		/>
		<StatCard
			title="Tasa de Atención"
			value="{completionRate}%"
			subtitle="{atendidas} de {stats.total} atendidas"
			accent="sage"
			trend={completionRate >= 70 ? { value: 'Buena', direction: 'up' } : completionRate > 0 ? { value: 'Baja', direction: 'down' } : undefined}
		/>
		<StatCard
			title="Inasistencias"
			value="{noShowRate}%"
			subtitle="{noAsistio} no asistieron"
			accent={noShowRate > 15 ? 'honey' : undefined}
			trend={noShowRate > 15 ? { value: 'Alto', direction: 'up' } : noShowRate > 0 ? { value: `${noAsistio}`, direction: 'neutral' } : undefined}
		/>
		<StatCard
			title="Cancelaciones"
			value="{cancellationRate}%"
			subtitle="{canceladas} canceladas"
			trend={cancellationRate > 20 ? { value: 'Alto', direction: 'up' } : undefined}
		/>
	</div>

	<!-- Breakdown toggle -->
	<button
		type="button"
		class="flex items-center gap-1.5 text-xs font-medium text-viking-600 dark:text-viking-400 hover:underline"
		onclick={() => (showBreakdown = !showBreakdown)}
	>
		<svg
			class="w-3.5 h-3.5 transition-transform duration-200 {showBreakdown ? 'rotate-180' : ''}"
			fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
		{showBreakdown ? 'Ocultar' : 'Ver'} desglose detallado
	</button>

	<!-- Breakdown BI (colapsable) -->
	{#if showBreakdown}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-in-up">

			<!-- ── Card 1: Estado de citas (donut visual) ── -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Distribución por Estado</h3>
				<div class="flex items-center gap-6">
					<div class="relative w-28 h-28 shrink-0">
						<svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
							{#each donutSegments as seg, i}
								{@const offset = donutSegments.slice(0, i).reduce((sum, s) => sum + s.pct, 0) + i}
								<circle
									r="15.91549"
									cx="18" cy="18"
									fill="none"
									stroke={seg.stroke}
									stroke-width="3.5"
									stroke-dasharray="{Math.max(seg.pct - 1, 0.5)} {100 - Math.max(seg.pct - 1, 0.5)}"
									stroke-dashoffset={-offset}
									stroke-linecap="round"
								/>
							{/each}
						</svg>
						<div class="absolute inset-0 flex flex-col items-center justify-center">
							<span class="text-xl font-bold text-ink tabular-nums">{stats.total}</span>
							<span class="text-[10px] text-ink-muted">citas</span>
						</div>
					</div>
					<div class="flex-1 space-y-1.5">
						{#each donutSegments as seg}
							{@const pct = stats.total > 0 ? Math.round((seg.count / stats.total) * 100) : 0}
							<div class="flex items-center gap-2">
								<span class="w-2.5 h-2.5 rounded-full shrink-0 {seg.dotColor}"></span>
								<span class="text-xs text-ink flex-1">{statusLabels[seg.status] ?? seg.status}</span>
								<span class="text-xs font-mono font-semibold text-ink tabular-nums">{seg.count}</span>
								<span class="text-[10px] text-ink-muted w-8 text-right tabular-nums">{pct}%</span>
							</div>
						{/each}
					</div>
				</div>
			</Card>

			<!-- ── Card 2: Distribución horaria ── -->
			<Card padding="lg">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Distribución Horaria</h3>
					<div class="flex items-center gap-1.5 text-xs text-ink-muted">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
						Pico: <span class="font-semibold text-ink font-mono">{peakHour}</span>
					</div>
				</div>
				{#if hourlyDistribution.some(h => h.count > 0)}
					<div class="flex items-end gap-1.5 h-28">
						{#each hourlyDistribution as h (h.hour)}
							{@const heightPct = (h.count / hourlyMax) * 100}
							{@const isPeak = h.count === hourlyMax && h.count > 0}
							<div class="flex-1 group flex flex-col items-center justify-end h-full relative">
								<div class="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-ink text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap z-10">
									{h.label} — {h.count} citas
								</div>
								{#if h.count > 0}
									<span class="text-[9px] font-mono text-ink-subtle mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{h.count}</span>
								{/if}
								<div
									class="w-full rounded-t transition-colors {isPeak ? 'bg-viking-500 dark:bg-viking-400' : h.count > 0 ? 'bg-viking-300/80 dark:bg-viking-700 group-hover:bg-viking-400 dark:group-hover:bg-viking-500' : 'bg-border/20'}"
									style:height="{h.count > 0 ? Math.max(heightPct, 6) : 4}%"
								></div>
								<span class="text-[10px] text-ink-subtle mt-1 font-mono leading-none">{String(h.hour).padStart(2, '0')}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="h-28 flex items-center justify-center">
						<p class="text-xs text-ink-subtle">Sin datos suficientes</p>
					</div>
				{/if}
			</Card>

			<!-- ── Card 3: Rendimiento por especialidad + doctor ── -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Rendimiento por Especialidad</h3>
				{#if stats.bySpecialty.length === 0}
					<p class="text-xs text-ink-subtle">Sin datos</p>
				{:else}
					<div class="space-y-2.5">
						{#each stats.bySpecialty.slice(0, 6) as spec (spec.name)}
							{@const pct = stats.total > 0 ? Math.round((spec.count / stats.total) * 100) : 0}
							{@const docsInSpec = stats.byDoctor.filter(d => d.specialty === spec.name)}
							{@const atendidosSpec = docsInSpec.reduce((s, d) => s + d.atendidas, 0)}
							{@const tasaAtencion = spec.count > 0 ? Math.round((atendidosSpec / spec.count) * 100) : 0}
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-medium text-ink">{spec.name}</span>
									<div class="flex items-center gap-3">
										<span class="text-xs text-ink-muted">{spec.count} citas</span>
										<span class="text-xs font-mono {tasaAtencion >= 70 ? 'text-emerald-600 dark:text-emerald-400' : tasaAtencion > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-subtle'}">{tasaAtencion}% atendidas</span>
									</div>
								</div>
								<div class="h-1.5 bg-canvas-subtle rounded-full overflow-hidden">
									<div class="h-full rounded-full bg-viking-500 transition-all" style:width="{pct}%"></div>
								</div>
								{#if docsInSpec.length > 0}
									<div class="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
										{#each docsInSpec as doc}
											<span class="text-[10px] text-ink-muted">
												{doc.name}: <span class="font-mono font-medium text-ink">{doc.atendidas}/{doc.count}</span>
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<!-- ── Card 4: Demografía de pacientes ── -->
			<Card padding="lg">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Demografía de Pacientes</h3>
				<div class="space-y-4">
					<!-- Nuevos vs Retorno -->
					<div>
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-xs text-ink-muted">Nuevos vs Retorno</span>
							<span class="text-xs font-semibold text-ink tabular-nums">{firstTimeRate}% primera vez</span>
						</div>
						<div class="flex h-2.5 rounded-full overflow-hidden gap-0.5">
							{#if stats.firstTimeCount > 0}
								<div class="bg-viking-500 rounded-full" style:width="{firstTimeRate}%" title="Primera vez: {stats.firstTimeCount}"></div>
							{/if}
							{#if stats.returningCount > 0}
								<div class="bg-iris-400 rounded-full" style:width="{100 - firstTimeRate}%" title="Retorno: {stats.returningCount}"></div>
							{/if}
						</div>
						<div class="flex justify-between mt-1">
							<span class="text-[11px] text-viking-600 dark:text-viking-400">Nuevos ({stats.firstTimeCount})</span>
							<span class="text-[11px] text-iris-600 dark:text-iris-400">Retorno ({stats.returningCount})</span>
						</div>
					</div>

					<!-- Tipo de paciente (barras horizontales) -->
					<div>
						<span class="text-xs text-ink-muted block mb-2">Por tipo de paciente</span>
						{#if sortedPatientTypes.length === 0}
							<p class="text-xs text-ink-subtle">Sin datos</p>
						{:else}
							<div class="space-y-1.5">
								{#each sortedPatientTypes as [tipo, count]}
									{@const widthPct = (count / maxPatientTypeCount) * 100}
									<div class="flex items-center gap-2">
										<span class="text-xs text-ink w-28 truncate">{patientTypeLabels[tipo] ?? tipo}</span>
										<div class="flex-1 h-4 bg-canvas-subtle rounded overflow-hidden relative">
											<div class="h-full bg-viking-200 dark:bg-viking-800 rounded transition-all" style:width="{widthPct}%"></div>
											<span class="absolute inset-y-0 left-1.5 flex items-center text-[10px] font-mono font-semibold text-ink">{count}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Filtros -->
	<div class="bg-surface rounded-xl border border-border p-3 sm:p-4">
		<AppointmentFilters
			doctores={data.doctores}
			especialidades={data.especialidades}
			value={data.filters}
			onchange={applyFilters}
		/>
	</div>

	<!-- Tabla -->
	<Card padding="none">
		<DataTable
			columns={[
				{ key: 'paciente_id', header: 'Paciente', render: pacienteCell },
				{ key: 'doctor_id',   header: 'Doctor',   render: doctorCell },
				{ key: 'fecha',       header: 'Fecha',    width: '110px', render: fechaCell },
				{ key: 'hora_inicio', header: 'Hora',     width: '80px'  },
				{ key: 'estado',      header: 'Estado',   width: '130px', align: 'center', render: estadoCell },
			] satisfies DataTableColumn<CitaRow>[]}
			data={data.citas.items as CitaRow[]}
			rowKey="id"
			rowMenu={citaMenu}
			emptyMessage="No hay citas que coincidan con los filtros aplicados."
		/>

		{@render paginationBar()}
	</Card>
</div>

<!-- Modal de detalle de cita -->
{#if viewingCita}
	{@const c = viewingCita}
	<Dialog open={true} onClose={() => { viewingCita = null; }} size="md">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</p>
			<h2 class="text-base font-semibold text-ink">Detalle de cita</h2>
		</DialogHeader>
		<DialogBody>
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<p class="text-ink-muted">Paciente</p>
					<p class="font-medium text-ink">{c.paciente.nombre} {c.paciente.apellido}</p>
					<p class="text-xs text-ink-muted">NHM {c.paciente.nhm} · {c.paciente.cedula}</p>
				</div>
				<div>
					<p class="text-ink-muted">Estado</p>
					<AppointmentStatusBadge status={c.estado} />
				</div>
				<div>
					<p class="text-ink-muted">Doctor</p>
					<p class="font-medium text-ink">Dr. {c.doctor.nombre} {c.doctor.apellido}</p>
					<p class="text-xs text-ink-muted">{c.doctor.especialidad?.nombre ?? '—'}</p>
				</div>
				<div>
					<p class="text-ink-muted">Duración</p>
					<p class="font-medium text-ink">{c.duracion_min} min{c.es_primera_vez ? ' · Primera vez' : ''}</p>
				</div>
				{#if c.motivo_consulta}
					<div class="col-span-2">
						<p class="text-ink-muted">Motivo</p>
						<p class="text-ink">{c.motivo_consulta}</p>
					</div>
				{/if}
				{#if c.observaciones}
					<div class="col-span-2">
						<p class="text-ink-muted">Observaciones</p>
						<p class="text-ink">{c.observaciones}</p>
					</div>
				{/if}
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={() => { viewingCita = null; }}>Cerrar</Button>
			{#if c.estado === 'pendiente' || c.estado === 'confirmada'}
				<Button type="button" variant="soft" size="md" onclick={() => {
					reschedulingCita = c;
					rescheduleDate = '';
					rescheduleSlots = [];
					rescheduleSelectedSlot = '';
					viewingCita = null;
				}}>Reagendar</Button>
				<Button type="button" variant="danger" size="md" onclick={() => { cancellingCita = c; viewingCita = null; }}>Cancelar cita</Button>
			{/if}
		</DialogFooter>
	</Dialog>
{/if}

<!-- Modal de confirmación de cancelación -->
{#if cancellingCita}
	{@const c = cancellingCita}
	<Dialog open={true} onClose={() => { cancellingCita = null; }} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Cancelar cita</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/cancelarCita"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						const nombre = cancellingCita?.paciente?.nombre ?? '';
						cancellingCita = null;
						await invalidateAll();
						toastWarning('Cita cancelada', `La cita de ${nombre} fue cancelada correctamente.`);
					} else {
						toastError('Error al cancelar', 'No se pudo cancelar la cita. Intente nuevamente.');
					}
				};
			}}
		>
			<input type="hidden" name="citaId" value={c.id} />
			<DialogBody>
				<p class="text-sm text-ink mb-3">¿Está seguro de que desea cancelar esta cita?</p>
				<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 space-y-1 text-sm">
					<p class="font-medium text-ink">{c.paciente.nombre} {c.paciente.apellido}</p>
					<p class="text-ink-muted">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</p>
					<p class="text-ink-muted">Dr. {c.doctor.nombre} {c.doctor.apellido} — {c.doctor.especialidad?.nombre}</p>
				</div>
				<p class="text-sm text-honey-700 dark:text-honey-400 mt-3">Esta acción no se puede deshacer.</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { cancellingCita = null; }}>No cancelar</Button>
				<Button type="submit" variant="danger" size="md">Sí, cancelar cita</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}

<!-- Modal de reagendamiento -->
{#if reschedulingCita}
	{@const c = reschedulingCita}
	{@const selectedSlotObj = rescheduleSlots.find((s) => s.hora_inicio === rescheduleSelectedSlot)}
	<Dialog open={true} onClose={() => { reschedulingCita = null; }} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">{c.paciente.nombre} {c.paciente.apellido} — Dr. {c.doctor.nombre} {c.doctor.apellido}</p>
			<h2 class="text-base font-semibold text-ink">Reagendar cita</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/reagendarCita"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						const nombre = reschedulingCita?.paciente?.nombre ?? '';
						const fecha = rescheduleDate;
						reschedulingCita = null;
						await invalidateAll();
						toastSuccess('Cita reagendada', `La cita de ${nombre} fue movida al ${fecha}.`);
					} else {
						toastError('Error al reagendar', 'No se pudo reagendar la cita. Intente nuevamente.');
					}
				};
			}}
		>
			<input type="hidden" name="citaId" value={c.id} />
			<input type="hidden" name="fecha" value={rescheduleDate} />
			<input type="hidden" name="hora_inicio" value={rescheduleSelectedSlot} />
			<input type="hidden" name="hora_fin" value={selectedSlotObj?.hora_fin ?? ''} />
			<input type="hidden" name="duracion" value={rescheduleSlotDuracion} />

			<DialogBody>
				<div class="space-y-4">
					<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 text-sm">
						<p class="text-ink-muted">Cita actual: <strong class="text-ink">{formatFecha(c.fecha)} · {c.hora_inicio}–{c.hora_fin}</strong></p>
					</div>

						<div>
						<p class="text-sm font-semibold text-ink mb-2">Seleccione nueva fecha</p>
						<DoctorAvailabilityCalendar
							year={new Date().getFullYear()}
							month={new Date().getMonth() + 1}
							availableDates={rescheduleAvailableDates}
							minDate={rescheduleMinDate()}
							selected={rescheduleDate}
							onSelect={loadRescheduleSlots}
							onMonthChange={() => {}}
						/>
					</div>

					{#if rescheduleDate}
						<div>
							<p class="text-sm font-semibold text-ink mb-2">Seleccione horario {rescheduleLoadingSlots ? '(cargando...)' : ''}</p>
							<TimeSlotPicker
								slots={rescheduleSlots}
								selected={rescheduleSelectedSlot}
								onSelect={(slot: TimeSlot) => { rescheduleSelectedSlot = slot.hora_inicio; }}
							/>
						</div>
					{/if}
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { reschedulingCita = null; }}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" disabled={!rescheduleSelectedSlot}>
					Confirmar reagendamiento
				</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
