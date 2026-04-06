<script lang="ts">
	import type { PageData } from './$types';
	import type { DoctorConEspecialidad, DisponibilidadDoctor } from '$shared/types/appointments.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Progress from '$shared/components/progress/Progress.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const doctores = $derived(data.doctores as DoctorConEspecialidad[]);
	const disponibilidadMap = $derived(data.disponibilidadMap as Record<string, DisponibilidadDoctor[]>);
	// Filtrar especialidades con nombre real (excluir UUIDs y sin datos)
	function isRealSpecialty(name: string): boolean {
		return !/^(Specialty-|[0-9a-f]{8})/.test(name) && !/^E2E-/.test(name);
	}
	const ocupacion = $derived(
		(data.ocupacionPorEspecialidad as { nombre: string; slotsDisponibles: number; slotsReservados: number }[])
			.filter(e => isRealSpecialty(e.nombre) && (e.slotsDisponibles > 0 || e.slotsReservados > 0))
	);
	const heatmap = $derived(data.heatmap as number[][]);
	const ausentismo = $derived(
		(data.ausentismoPorEspecialidad as { nombre: string; total: number; noShows: number; tasa: number }[])
			.filter(e => isRealSpecialty(e.nombre))
	);

	let filtroEspecialidad = $state('');
	let showAnalytics = $state(true);

	// ── Tabla ──
	type DoctorRow = {
		id: string;
		nombre: string;
		especialidad: string;
		lun: string;
		mar: string;
		mie: string;
		jue: string;
		vie: string;
		horas: number;
		slots: number;
	} & Record<string, unknown>;

	function formatBloques(bloques: DisponibilidadDoctor[]): string {
		if (bloques.length === 0) return '—';
		return bloques.map((b) => `${b.hora_inicio.slice(0, 5)}–${b.hora_fin.slice(0, 5)}`).join('\n');
	}

	function getBloquesDia(doctorId: string, dow: number): DisponibilidadDoctor[] {
		return (disponibilidadMap[doctorId] ?? []).filter((b) => b.day_of_week === dow);
	}

	function calcHoras(doctorId: string): number {
		const bloques = disponibilidadMap[doctorId] ?? [];
		let totalMin = 0;
		for (const b of bloques) {
			const [hi, mi] = b.hora_inicio.split(':').map(Number);
			const [hf, mf] = b.hora_fin.split(':').map(Number);
			totalMin += (hf * 60 + mf) - (hi * 60 + mi);
		}
		return Math.round(totalMin / 60 * 10) / 10;
	}

	function calcSlots(doctorId: string): number {
		const bloques = disponibilidadMap[doctorId] ?? [];
		let total = 0;
		for (const b of bloques) {
			const [hi, mi] = b.hora_inicio.split(':').map(Number);
			const [hf, mf] = b.hora_fin.split(':').map(Number);
			total += Math.floor(((hf * 60 + mf) - (hi * 60 + mi)) / (b.duracion_slot || 30));
		}
		return total;
	}

	const rows = $derived.by<DoctorRow[]>(() => {
		let docs = doctores;
		if (filtroEspecialidad) docs = docs.filter((d) => d.especialidad_id === filtroEspecialidad);
		return docs.map((d) => ({
			id: d.id,
			nombre: `Dr. ${d.nombre} ${d.apellido}`,
			especialidad: d.especialidad.nombre,
			lun: formatBloques(getBloquesDia(d.id, 1)),
			mar: formatBloques(getBloquesDia(d.id, 2)),
			mie: formatBloques(getBloquesDia(d.id, 3)),
			jue: formatBloques(getBloquesDia(d.id, 4)),
			vie: formatBloques(getBloquesDia(d.id, 5)),
			horas: calcHoras(d.id),
			slots: calcSlots(d.id)
		}));
	});

	const totalDoctores = $derived(rows.length);
	const totalSlots = $derived(rows.reduce((a: number, r: DoctorRow) => a + r.slots, 0));
	const totalHoras = $derived(rows.reduce((a: number, r: DoctorRow) => a + r.horas, 0));

	// ── Heatmap ──
	const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
	const horasLabel = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
	const heatmapMax = $derived(Math.max(1, ...heatmap.flat()));

	function heatColor(val: number): string {
		if (val === 0) return 'bg-canvas-subtle';
		const ratio = val / heatmapMax;
		if (ratio < 0.25) return 'bg-viking-100 dark:bg-viking-900/20';
		if (ratio < 0.5) return 'bg-viking-200 dark:bg-viking-800/30';
		if (ratio < 0.75) return 'bg-viking-400 dark:bg-viking-600/50';
		return 'bg-viking-600 dark:bg-viking-500/70';
	}

	function heatTextColor(val: number): string {
		if (val === 0) return 'text-ink-subtle';
		const ratio = val / heatmapMax;
		if (ratio < 0.5) return 'text-viking-700 dark:text-viking-300';
		return 'text-white dark:text-white';
	}

	// Ocupación promedio general (cap at 100%)
	const ocupacionPromedio = $derived.by(() => {
		const totalDisp = ocupacion.reduce((a, o) => a + o.slotsDisponibles, 0);
		const totalRes = ocupacion.reduce((a, o) => a + o.slotsReservados, 0);
		if (totalDisp === 0) return 0;
		return Math.min(Math.round((totalRes / totalDisp) * 100), 100);
	});

	// Agrupar peakHours por hora (el backend devuelve minutos exactos)
	// Solo mostrar el rango con datos (± 1 hora de buffer)
	const hourlyDistribution = $derived.by(() => {
		const rawHours = (data.stats as { peakHours: { hour: string; count: number }[] }).peakHours;
		const byHour = new Map<number, number>();
		for (const h of rawHours) {
			const hour = parseInt(h.hour.split(':')[0], 10);
			byHour.set(hour, (byHour.get(hour) ?? 0) + h.count);
		}
		// Encontrar rango con datos
		const hoursWithData = [...byHour.keys()];
		const minH = hoursWithData.length > 0 ? Math.max(7, Math.min(...hoursWithData) - 1) : 7;
		const maxH = hoursWithData.length > 0 ? Math.min(18, Math.max(...hoursWithData) + 1) : 18;
		const result: { hour: number; label: string; count: number }[] = [];
		for (let h = minH; h <= maxH; h++) {
			result.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, count: byHour.get(h) ?? 0 });
		}
		return result;
	});
	const maxHourCount = $derived(Math.max(1, ...hourlyDistribution.map(h => h.count)));
</script>

{#snippet doctorCell(_value: unknown, row: DoctorRow)}
	<div class="flex items-center gap-2.5 py-0.5">
		<div class="w-7 h-7 rounded-full bg-viking-100 dark:bg-viking-900/30 flex items-center justify-center text-[10px] font-bold text-viking-700 dark:text-viking-300 shrink-0">
			{(row.nombre.replace('Dr. ', '').split(' ')[0]?.[0] ?? '')}{(row.nombre.replace('Dr. ', '').split(' ')[1]?.[0] ?? '')}
		</div>
		<p class="text-sm font-medium text-ink truncate">{row.nombre}</p>
	</div>
{/snippet}

{#snippet especialidadCell(value: unknown)}
	<Badge variant="info" style="soft" size="sm">{String(value)}</Badge>
{/snippet}

{#snippet horarioCell(value: unknown)}
	{@const text = String(value)}
	{#if text === '—'}
		<span class="text-ink-subtle">—</span>
	{:else}
		<div class="space-y-0.5">
			{#each text.split('\n') as rango}
				<div class="inline-flex px-1.5 py-0.5 rounded bg-viking-50 dark:bg-viking-900/20 border border-viking-200/60 dark:border-viking-800/40">
					<span class="text-xs font-mono text-viking-700 dark:text-viking-300">{rango}</span>
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet numCell(value: unknown)}
	<span class="text-sm font-mono font-semibold text-ink">{value}</span>
{/snippet}

{#snippet slotsCell(value: unknown)}
	<span class="text-sm font-mono font-semibold text-viking-600">{value}</span>
{/snippet}

<svelte:head><title>Horarios Doctores</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<h1 class="text-xl font-bold text-ink">Horarios de Doctores</h1>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors {showAnalytics ? 'bg-viking-50 dark:bg-viking-900/20 border-viking-200 dark:border-viking-800 text-viking-700 dark:text-viking-300' : 'border-border/60 text-ink-muted hover:text-ink hover:bg-canvas-subtle'}"
				onclick={() => { showAnalytics = !showAnalytics; }}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
				</svg>
				Analítica
			</button>
			<select
				bind:value={filtroEspecialidad}
				class="text-sm border border-border/60 rounded-lg px-3 py-2 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-viking-500/40"
			>
				<option value="">Todas las especialidades</option>
				{#each data.especialidades.filter(e => isRealSpecialty(e.nombre)) as esp}
					<option value={esp.id}>{esp.nombre}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<StatCard title="Doctores" value={totalDoctores} />
		<StatCard title="Slots / semana" value={totalSlots} accent="viking" />
		<StatCard title="Horas / semana" value={totalHoras} accent="sage" />
		<StatCard title="Ocupación" value="{ocupacionPromedio}%" accent="honey" />
	</div>

	<!-- ═══ ANALÍTICA ═══ -->
	{#if showAnalytics}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">

			<!-- Heatmap de horarios pico -->
			<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-ink mb-1">Mapa de Calor</h3>
				<p class="text-xs text-ink-muted mb-3">Concentración de citas por día y hora</p>
				<div class="overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr>
								<th class="w-10"></th>
								{#each horasLabel as h}
									<th class="text-[9px] font-mono text-ink-subtle px-0.5 pb-1 text-center font-normal">{h.slice(0, 2)}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each diasLabel as dia, di}
								<tr>
									<td class="text-[10px] font-medium text-ink-muted pr-1.5 text-right py-0.5">{dia}</td>
									{#each heatmap[di] as val, hi}
										<td class="px-0.5 py-0.5">
											<div
												class="w-full aspect-square rounded-sm flex items-center justify-center {heatColor(val)}"
												title="{diasLabel[di]} {horasLabel[hi]}: {val} citas"
											>
												{#if val > 0}
													<span class="text-[9px] font-mono font-bold {heatTextColor(val)}">{val}</span>
												{/if}
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
					<span class="text-[10px] text-ink-subtle">Menor</span>
					<div class="flex gap-0.5">
						<div class="w-4 h-3 rounded-sm bg-canvas-subtle border border-border/30"></div>
						<div class="w-4 h-3 rounded-sm bg-viking-100 dark:bg-viking-900/20"></div>
						<div class="w-4 h-3 rounded-sm bg-viking-200 dark:bg-viking-800/30"></div>
						<div class="w-4 h-3 rounded-sm bg-viking-400 dark:bg-viking-600/50"></div>
						<div class="w-4 h-3 rounded-sm bg-viking-600 dark:bg-viking-500/70"></div>
					</div>
					<span class="text-[10px] text-ink-subtle">Mayor</span>
				</div>
			</div>

			<!-- Distribución horaria (barras verticales agrupadas) -->
			<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
				<h3 class="text-sm font-semibold text-ink mb-1">Distribución Horaria</h3>
				<p class="text-xs text-ink-muted mb-3">Citas agendadas por franja horaria</p>
				{#if hourlyDistribution.some(h => h.count > 0)}
					<div class="flex items-end gap-1.5 h-32">
						{#each hourlyDistribution as h (h.hour)}
							{@const heightPct = (h.count / maxHourCount) * 100}
							{@const isPeak = h.count === maxHourCount && h.count > 0}
							<div class="flex-1 group flex flex-col items-center justify-end h-full relative">
								<div class="absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-ink text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap z-10">
									{h.label} — {h.count}
								</div>
								{#if h.count > 0}
									<span class="text-[9px] font-mono text-ink-muted mb-0.5">{h.count}</span>
								{/if}
								<div
									class="w-full rounded-t transition-colors {isPeak ? 'bg-viking-500 dark:bg-viking-400' : h.count > 0 ? 'bg-viking-300/80 dark:bg-viking-700 group-hover:bg-viking-400' : 'bg-border/20'}"
									style:height="{h.count > 0 ? Math.max(heightPct, 6) : 4}%"
								></div>
								<span class="text-[10px] text-ink-subtle mt-1 font-mono">{String(h.hour).padStart(2, '0')}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="h-32 flex items-center justify-center">
						<p class="text-xs text-ink-subtle">Sin datos</p>
					</div>
				{/if}
			</div>

			<!-- Ocupación por especialidad (solo las que tienen datos) -->
			{#if ocupacion.length > 0}
				<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
					<h3 class="text-sm font-semibold text-ink mb-1">Carga por Especialidad</h3>
					<p class="text-xs text-ink-muted mb-3">Slots semanales disponibles vs citas agendadas</p>
					<div class="space-y-2.5">
						{#each ocupacion as esp}
							{@const rate = esp.slotsDisponibles > 0 ? Math.round((esp.slotsReservados / esp.slotsDisponibles) * 100) : 0}
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-medium text-ink">{esp.nombre}</span>
									<span class="text-xs text-ink-muted tabular-nums">
										<span class="font-mono font-semibold text-ink">{esp.slotsReservados}</span> citas · {esp.slotsDisponibles} slots/sem
									</span>
								</div>
								<Progress
									value={Math.min(esp.slotsReservados, esp.slotsDisponibles)}
									max={Math.max(esp.slotsDisponibles, 1)}
									variant={rate > 80 ? 'danger' : rate > 50 ? 'warning' : 'success'}
									size="sm"
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Ausentismo -->
			{#if ausentismo.length > 0}
				<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
					<h3 class="text-sm font-semibold text-ink mb-1">Índice de Ausentismo</h3>
					<p class="text-xs text-ink-muted mb-3">No-shows por especialidad</p>
					<div class="space-y-2">
						{#each ausentismo as esp}
							<div class="flex items-center gap-3">
								<span class="text-xs font-medium text-ink w-32 truncate shrink-0">{esp.nombre}</span>
								<div class="flex-1 h-4 bg-canvas-subtle rounded overflow-hidden">
									<div
										class="h-full rounded transition-all {esp.tasa > 20 ? 'bg-red-400 dark:bg-red-500/60' : esp.tasa > 10 ? 'bg-honey-400 dark:bg-honey-500/60' : 'bg-sage-400 dark:bg-sage-500/60'}"
										style="width: {Math.max(esp.tasa, 3)}%"
									></div>
								</div>
								<div class="text-right shrink-0 w-20">
									<span class="text-xs font-mono font-semibold {esp.tasa > 20 ? 'text-red-600 dark:text-red-400' : 'text-ink'}">{esp.tasa}%</span>
									<span class="text-[10px] text-ink-subtle ml-0.5">({esp.noShows}/{esp.total})</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ═══ TABLA DE HORARIOS ═══ -->
	<DataTable
		columns={[
			{ key: 'nombre', header: 'Doctor', render: doctorCell },
			{ key: 'especialidad', header: 'Especialidad', render: especialidadCell, width: '140px' },
			{ key: 'lun', header: 'Lun', render: horarioCell, align: 'center', width: '120px' },
			{ key: 'mar', header: 'Mar', render: horarioCell, align: 'center', width: '120px' },
			{ key: 'mie', header: 'Mié', render: horarioCell, align: 'center', width: '120px' },
			{ key: 'jue', header: 'Jue', render: horarioCell, align: 'center', width: '120px' },
			{ key: 'vie', header: 'Vie', render: horarioCell, align: 'center', width: '120px' },
			{ key: 'horas', header: 'Hrs/sem', render: numCell, align: 'right', width: '80px', sortable: true },
			{ key: 'slots', header: 'Slots', render: slotsCell, align: 'right', width: '70px', sortable: true }
		] satisfies DataTableColumn<DoctorRow>[]}
		data={rows}
		rowKey="id"
		bordered
		emptyMessage="No se encontraron doctores con esa especialidad"
		rowMenu={[
			{ label: 'Ver citas agendadas', icon: 'view', onclick: (row: DoctorRow) => { goto(`/analista/citas?doctor_id=${row.id}`); } }
		] satisfies RowMenuItem<DoctorRow>[]}
		onRowClick={(row: DoctorRow) => { goto(`/analista/citas?doctor_id=${row.id}`); }}
	/>
</div>
