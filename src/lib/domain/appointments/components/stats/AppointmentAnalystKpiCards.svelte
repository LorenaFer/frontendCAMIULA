<script lang="ts">
	import type { CitasStats } from '$lib/server/appointments/appointments.service.js';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Sparkline from '$shared/components/sparkline/Sparkline.svelte';

	let { stats }: { stats: CitasStats } = $props();

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
</script>

{#snippet trendSparkline()}
	{#if stats.dailyTrend.length >= 2}
		<Sparkline data={stats.dailyTrend} color="blue" />
	{/if}
{/snippet}

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
