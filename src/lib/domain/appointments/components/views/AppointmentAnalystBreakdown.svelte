<script lang="ts">
	import type { CitasStats } from '$lib/server/appointments/appointments.service.js';
	import Card from '$shared/components/card/Card.svelte';

	let { stats }: { stats: CitasStats } = $props();

	let showBreakdown = $state(false);

	const atendidas = $derived(stats.byStatus['atendida'] ?? 0);
	const noAsistio = $derived(stats.byStatus['no_asistio'] ?? 0);
	const canceladas = $derived(stats.byStatus['cancelada'] ?? 0);

	const firstTimeRate = $derived(
		stats.total > 0 ? Math.round((stats.firstTimeCount / stats.total) * 100) : 0
	);

	const patientTypeLabels: Record<string, string> = {
		P: 'Profesores', E: 'Empleados', O: 'Obreros', B: 'Estudiantes',
		F: 'Familiares', X: 'Caso Especial',
		C: 'Fam. Estudiante', R: 'Fam. Profesor', S: 'Fam. Empleado', T: 'Fam. Obrero',
		empleado: 'Empleados', estudiante: 'Estudiantes', profesor: 'Profesores', tercero: 'Terceros'
	};

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

	const peakHour = $derived.by(() => {
		const peak = hourlyDistribution.reduce((a, b) => (b.count > a.count ? b : a), hourlyDistribution[0]);
		return peak && peak.count > 0 ? peak.label : '—';
	});
</script>

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
