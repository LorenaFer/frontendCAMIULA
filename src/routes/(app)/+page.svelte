<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$shared/components/card/Card.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Sparkline from '$shared/components/sparkline/Sparkline.svelte';
	import ProgressRing from '$shared/components/sparkline/ProgressRing.svelte';
	import Progress from '$shared/components/progress/Progress.svelte';

	let { data }: { data: PageData } = $props();

	const stats = $derived(data.statsGlobal);
	const atendidas = $derived(stats.byStatus['atendida'] ?? 0);
	const noAsistio = $derived(stats.byStatus['no_asistio'] ?? 0);
	const canceladas = $derived(stats.byStatus['cancelada'] ?? 0);
	const pendientes = $derived((stats.byStatus['pendiente'] ?? 0) + (stats.byStatus['confirmada'] ?? 0));

	const tasaAtencion = $derived(stats.total > 0 ? Math.round((atendidas / stats.total) * 100) : 0);
	const tasaNoShow = $derived(stats.total > 0 ? Math.round((noAsistio / stats.total) * 100) : 0);
	const tasaCancelacion = $derived(stats.total > 0 ? Math.round((canceladas / stats.total) * 100) : 0);

	const ocupacion = $derived(data.ocupacionPorEspecialidad as { nombre: string; slotsDisponibles: number; citasAgendadas: number }[]);
	const ocupacionPromedio = $derived.by(() => {
		const totalD = ocupacion.reduce((a, o) => a + o.slotsDisponibles, 0);
		const totalR = ocupacion.reduce((a, o) => a + o.citasAgendadas, 0);
		return totalD > 0 ? Math.round((totalR / totalD) * 100) : 0;
	});

	const heatmap = $derived(data.heatmap as number[][]);
	const heatmapMax = $derived(Math.max(1, ...heatmap.flat()));
	const diasLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
	const horasLabel = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, '0')}`);

	function heatColor(val: number): string {
		if (val === 0) return 'bg-canvas-subtle';
		const r = val / heatmapMax;
		if (r < 0.25) return 'bg-viking-100 dark:bg-viking-900/20';
		if (r < 0.5) return 'bg-viking-200 dark:bg-viking-800/30';
		if (r < 0.75) return 'bg-viking-400 dark:bg-viking-600/50';
		return 'bg-viking-600 dark:bg-viking-500/70';
	}
	function heatText(val: number): string {
		if (val === 0) return 'text-ink-subtle';
		return val / heatmapMax >= 0.5 ? 'text-white' : 'text-viking-700 dark:text-viking-300';
	}

	const ausentismo = $derived(data.ausentismoPorEspecialidad as { nombre: string; total: number; noShows: number; tasa: number }[]);
	const topDx = $derived(data.topDiagnosticos as { cie10: string; descripcion: string; count: number }[]);
	const stockReport = $derived(data.stockReport);
	const consumo = $derived(data.consumptionReport);
	const expReport = $derived(data.expirationReport);

	const patientTypeLabels: Record<string, string> = {
		empleado: 'Empleados', estudiante: 'Estudiantes', profesor: 'Profesores', tercero: 'Terceros'
	};

	const statusColors: Record<string, string> = {
		pendiente: 'bg-honey-400', confirmada: 'bg-viking-400', atendida: 'bg-sage-400', cancelada: 'bg-red-400', no_asistio: 'bg-iris-400'
	};
	const statusLabels: Record<string, string> = {
		pendiente: 'Pendientes', confirmada: 'Confirmadas', atendida: 'Atendidas', cancelada: 'Canceladas', no_asistio: 'No asistió'
	};
</script>

{#snippet trendSpark()}
	{#if stats.dailyTrend.length >= 2}
		<Sparkline data={stats.dailyTrend} color="blue" />
	{/if}
{/snippet}

{#snippet atencionRing()}
	<ProgressRing value={tasaAtencion} max={100} color="success" size={44} showValue />
{/snippet}

{#snippet ocupacionRing()}
	<ProgressRing value={ocupacionPromedio} max={100} color={ocupacionPromedio > 80 ? 'danger' : 'blue'} size={44} showValue />
{/snippet}

<svelte:head><title>Dashboard — Centro Ambulatorio ULA</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div>
		<h1 class="text-xl font-bold text-ink">Dashboard</h1>
		<p class="text-xs text-ink-muted font-mono mt-0.5">
			{new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
		</p>
	</div>

	<!-- ═══ FILA EJECUTIVA ═══ -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<StatCard title="Total Citas" value={stats.total} subtitle="{data.citasHoy} hoy · {pendientes} en agenda" accent="viking" visualization={trendSpark} />
		<StatCard title="Tasa de Atención" value="{tasaAtencion}%" subtitle="{atendidas} de {stats.total} atendidas" accent="sage" visualization={atencionRing} />
		<StatCard title="Ocupación Slots" value="{ocupacionPromedio}%" subtitle="Demanda vs disponibilidad" accent="iris" visualization={ocupacionRing} />
		<StatCard title="Pacientes" value={data.totalPacientes} subtitle="{data.pacientesNuevos} nuevos · {data.totalDoctores} doctores" accent="honey" />
	</div>

	<!-- ═══ CITAS: Estado + Especialidad ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Distribución por estado -->
		<Card padding="lg">
			<h3 class="text-sm font-semibold text-ink mb-4">Distribución por Estado</h3>
			<!-- Barra apilada -->
			{#if stats.total > 0}
				<div class="h-5 rounded-full overflow-hidden flex mb-3">
					{#each Object.entries(stats.byStatus) as [estado, count]}
						{@const pct = (count / stats.total) * 100}
						{#if pct > 0}
							<div class="{statusColors[estado] ?? 'bg-border'}" style="width: {pct}%" title="{statusLabels[estado] ?? estado}: {count}"></div>
						{/if}
					{/each}
				</div>
				<div class="flex flex-wrap gap-x-4 gap-y-1">
					{#each Object.entries(stats.byStatus) as [estado, count]}
						<div class="flex items-center gap-1.5">
							<div class="w-2.5 h-2.5 rounded-full {statusColors[estado] ?? 'bg-border'}"></div>
							<span class="text-xs text-ink-muted">{statusLabels[estado] ?? estado}</span>
							<span class="text-xs font-mono font-semibold text-ink">{count}</span>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<!-- Citas por especialidad -->
		<Card padding="lg">
			<h3 class="text-sm font-semibold text-ink mb-4">Citas por Especialidad</h3>
			<div class="space-y-2.5">
				{#each stats.bySpecialty.slice(0, 5) as esp}
					{@const pct = stats.total > 0 ? (esp.count / stats.total) * 100 : 0}
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="text-xs font-medium text-ink">{esp.name}</span>
							<span class="text-xs font-mono text-ink-muted">{esp.count} <span class="text-ink-subtle">({Math.round(pct)}%)</span></span>
						</div>
						<div class="h-2 rounded-full bg-canvas-subtle overflow-hidden">
							<div class="h-full rounded-full bg-viking-500" style="width: {pct}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	</div>

	<!-- ═══ HEATMAP + NO-SHOW ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Heatmap -->
		<Card padding="lg">
			<h3 class="text-sm font-semibold text-ink mb-1">Mapa de Calor — Horarios Pico</h3>
			<p class="text-xs text-ink-muted mb-3">Concentración de citas por día y hora</p>
			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th class="w-8"></th>
						{#each horasLabel as h}
							<th class="text-[9px] font-mono text-ink-subtle px-0.5 pb-1 text-center font-normal">{h}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each diasLabel as dia, di}
						<tr>
							<td class="text-[10px] font-medium text-ink-muted pr-1 text-right py-0.5">{dia}</td>
							{#each heatmap[di] as val}
								<td class="px-0.5 py-0.5">
									<div class="w-full aspect-square rounded-sm flex items-center justify-center {heatColor(val)}">
										{#if val > 0}<span class="text-[8px] font-mono font-bold {heatText(val)}">{val}</span>{/if}
									</div>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<div class="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
				<span class="text-[10px] text-ink-subtle">Menor</span>
				<div class="flex gap-0.5">
					<div class="w-3 h-2.5 rounded-sm bg-canvas-subtle border border-border/30"></div>
					<div class="w-3 h-2.5 rounded-sm bg-viking-100 dark:bg-viking-900/20"></div>
					<div class="w-3 h-2.5 rounded-sm bg-viking-400 dark:bg-viking-600/50"></div>
					<div class="w-3 h-2.5 rounded-sm bg-viking-600 dark:bg-viking-500/70"></div>
				</div>
				<span class="text-[10px] text-ink-subtle">Mayor</span>
			</div>
		</Card>

		<!-- No-Show + Distribución horaria -->
		<div class="space-y-4">
			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Ausentismo por Especialidad</h3>
				{#each ausentismo as esp}
					<div class="flex items-center gap-3 mb-2">
						<span class="text-xs font-medium text-ink w-24 truncate shrink-0">{esp.nombre}</span>
						<div class="flex-1 h-4 bg-canvas-subtle rounded-md overflow-hidden">
							<div class="h-full rounded-md {esp.tasa > 20 ? 'bg-red-400' : esp.tasa > 10 ? 'bg-honey-400' : 'bg-sage-400'}" style="width: {Math.max(esp.tasa, 2)}%"></div>
						</div>
						<span class="text-xs font-mono font-semibold w-10 text-right {esp.tasa > 20 ? 'text-red-600 dark:text-red-400' : 'text-ink'}">{esp.tasa}%</span>
					</div>
				{/each}
			</Card>

			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Distribución Horaria</h3>
				{@const maxH = Math.max(1, ...stats.peakHours.map((h) => h.count))}
				<div class="space-y-1">
					{#each stats.peakHours as ph}
						<div class="flex items-center gap-2">
							<span class="text-[10px] font-mono text-ink-muted w-10 shrink-0">{ph.hour}</span>
							<div class="flex-1 h-4 bg-canvas-subtle rounded-md overflow-hidden">
								<div class="h-full rounded-md bg-iris-400 dark:bg-iris-500/60" style="width: {(ph.count / maxH) * 100}%"></div>
							</div>
							<span class="text-[10px] font-mono font-semibold text-ink w-4 text-right">{ph.count}</span>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</div>

	<!-- ═══ DOCTORES + PACIENTES ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Rendimiento por doctor -->
		<Card padding="lg">
			<h3 class="text-sm font-semibold text-ink mb-4">Rendimiento por Doctor</h3>
			<div class="space-y-2.5">
				{#each stats.byDoctor as doc}
					{@const rate = doc.count > 0 ? Math.round((doc.atendidas / doc.count) * 100) : 0}
					<div class="flex items-center gap-3">
						<div class="w-7 h-7 rounded-full bg-viking-100 dark:bg-viking-900/30 flex items-center justify-center text-[10px] font-bold text-viking-700 dark:text-viking-300 shrink-0">
							{doc.name.replace('Dr. ', '')[0]}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between mb-0.5">
								<span class="text-xs font-medium text-ink truncate">{doc.name}</span>
								<span class="text-xs text-ink-muted">{doc.atendidas}/{doc.count} · <span class="font-semibold text-ink">{rate}%</span></span>
							</div>
							<Progress value={doc.atendidas} max={Math.max(doc.count, 1)} variant={rate >= 70 ? 'success' : rate >= 40 ? 'warning' : 'danger'} size="sm" />
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Pacientes y demografía -->
		<div class="space-y-4">
			<!-- Tipo de paciente -->
			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Pacientes por Tipo</h3>
				<div class="flex flex-wrap gap-2">
					{#each Object.entries(data.pacientesPorTipo) as [tipo, count]}
						<div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-canvas-subtle border border-border/40">
							<span class="text-xs text-ink-muted">{patientTypeLabels[tipo] ?? tipo}</span>
							<span class="text-sm font-mono font-bold text-ink">{count}</span>
						</div>
					{/each}
				</div>
				<div class="flex items-center gap-4 mt-3 pt-2 border-t border-border/30 text-xs text-ink-muted">
					<span>Primera vez: <span class="font-semibold text-ink">{stats.firstTimeCount}</span></span>
					<span>Retorno: <span class="font-semibold text-ink">{stats.returningCount}</span></span>
					<span>M: <span class="font-semibold text-ink">{data.pacientesPorSexo.M}</span> · F: <span class="font-semibold text-ink">{data.pacientesPorSexo.F}</span></span>
				</div>
			</Card>

			<!-- Diagnósticos frecuentes -->
			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Diagnósticos Frecuentes</h3>
				{#if topDx.length === 0}
					<p class="text-xs text-ink-subtle text-center py-3">Sin datos</p>
				{:else}
					<div class="space-y-2">
						{#each topDx as dx, i}
							<div class="flex items-center gap-2.5">
								<span class="w-5 h-5 rounded-full bg-canvas-subtle flex items-center justify-center text-[10px] font-bold text-ink-muted shrink-0">{i + 1}</span>
								<div class="flex-1 min-w-0">
									<p class="text-xs font-medium text-ink truncate">{dx.descripcion}</p>
									{#if dx.cie10}<p class="text-[10px] text-ink-subtle font-mono">{dx.cie10}</p>{/if}
								</div>
								<span class="text-xs font-mono font-semibold text-viking-600">{dx.count}</span>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>
	</div>

	<!-- ═══ INVENTARIO ═══ -->
	<div>
		<h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
			<svg class="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
			Farmacia e Inventario
		</h2>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
			<StatCard title="Medicamentos" value={stockReport.total_medications} />
			<StatCard title="Stock Crítico" value={stockReport.critical_count} accent={stockReport.critical_count > 0 ? 'honey' : undefined} />
			<StatCard title="Lotes por Vencer" value={expReport.batches.length} subtitle="Próximos 90 días" accent={expReport.batches.length > 0 ? 'honey' : undefined} />
			<StatCard title="Valor Inventario" value={"Bs. " + data.valorInventario.toLocaleString()} accent="sage" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- Estado del stock -->
			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Estado del Stock</h3>
				<div class="space-y-2.5">
					{#each stockReport.items as item}
						{@const variant = item.stock_alert === 'critical' ? 'danger' : item.stock_alert === 'low' ? 'warning' : item.stock_alert === 'expired' ? 'danger' : 'success'}
						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-medium text-ink">{item.generic_name}</span>
								<div class="flex items-center gap-1.5">
									<span class="text-xs font-mono text-ink-muted">{item.total_available} {item.unit_measure}</span>
									<Badge variant={variant} style="soft" size="xs">{item.stock_alert}</Badge>
								</div>
							</div>
							<Progress value={item.total_available} max={Math.max(item.total_available * 2, 100)} {variant} size="sm" />
						</div>
					{/each}
				</div>
			</Card>

			<!-- Medicamentos más despachados -->
			<Card padding="lg">
				<h3 class="text-sm font-semibold text-ink mb-3">Medicamentos Más Despachados</h3>
				{#if consumo.items.length === 0}
					<p class="text-xs text-ink-subtle text-center py-3">Sin datos de consumo este mes</p>
				{:else}
					{@const maxDesp = Math.max(1, ...consumo.items.map((i) => i.total_dispatched))}
					<div class="space-y-2.5">
						{#each consumo.items.slice(0, 5) as item}
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-medium text-ink">{item.generic_name}</span>
									<span class="text-xs text-ink-muted">{item.total_dispatched} uds · {item.patient_count} pac.</span>
								</div>
								<div class="h-2 rounded-full bg-canvas-subtle overflow-hidden">
									<div class="h-full rounded-full bg-sage-500" style="width: {(item.total_dispatched / maxDesp) * 100}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>
	</div>

	<!-- ═══ CRUCES ESTRATÉGICOS ═══ -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
		<Card class="text-center py-4">
			<p class="text-2xl font-bold font-mono text-ink">{tasaNoShow}%</p>
			<p class="text-xs text-ink-muted mt-1">Tasa No-Show</p>
			<p class="text-[10px] text-ink-subtle">{noAsistio} de {stats.total}</p>
		</Card>
		<Card class="text-center py-4">
			<p class="text-2xl font-bold font-mono text-ink">{tasaCancelacion}%</p>
			<p class="text-xs text-ink-muted mt-1">Tasa Cancelación</p>
			<p class="text-[10px] text-ink-subtle">{canceladas} de {stats.total}</p>
		</Card>
		<Card class="text-center py-4">
			{@const peakHour = stats.peakHours.length > 0 ? stats.peakHours.reduce((a, b) => b.count > a.count ? b : a).hour : '—'}
			<p class="text-2xl font-bold font-mono text-ink">{peakHour}</p>
			<p class="text-xs text-ink-muted mt-1">Hora Pico</p>
		</Card>
		<Card class="text-center py-4">
			{@const topEsp = stats.bySpecialty[0]}
			<p class="text-lg font-bold text-ink">{topEsp?.name ?? '—'}</p>
			<p class="text-xs text-ink-muted mt-1">Especialidad Top</p>
			{#if topEsp}<p class="text-[10px] text-ink-subtle">{topEsp.count} citas</p>{/if}
		</Card>
	</div>
</div>
