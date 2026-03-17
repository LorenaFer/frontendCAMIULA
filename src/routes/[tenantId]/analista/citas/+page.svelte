<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AppointmentFilters as AppointmentFiltersType, CitaConPaciente } from '$shared/types/appointments.js';
	import AppointmentFilters from '$shared/components/appointments/AppointmentFilters.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import VirtualList from '$shared/components/appointments/VirtualList.svelte';
	import StatCard from '$shared/components/card/StatCard.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';

	let { data }: { data: PageData } = $props();

	const ROW_HEIGHT = 64;
	const LIST_HEIGHT = 520;

	function applyFilters(filters: AppointmentFiltersType) {
		const qs = new URLSearchParams();
		if (filters.fecha) qs.set('fecha', filters.fecha);
		if (filters.doctorId) qs.set('doctorId', String(filters.doctorId));
		if (filters.especialidadId) qs.set('especialidadId', String(filters.especialidadId));
		if (filters.estado) qs.set('estado', filters.estado);
		if (filters.search) qs.set('search', filters.search);
		qs.set('page', '1');
		goto(`?${qs}`, { replaceState: true });
	}

	function changePage(p: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('page', String(p));
		goto(`?${qs}`, { replaceState: true });
	}

	// Stats rápidas
	const statsTotal = $derived(data.citas.total);
	const statsPendientes = $derived(
		(data.citas.data as CitaConPaciente[]).filter((c) => c.estado === 'pendiente').length
	);
	const statsAtendidas = $derived(
		(data.citas.data as CitaConPaciente[]).filter((c) => c.estado === 'atendida').length
	);

	function exportar() {
		const qs = new URLSearchParams($page.url.searchParams);
		window.location.href = `?/exportarExcel&${qs}`;
	}
</script>

<svelte:head>
	<title>Gestión de Citas — Analista</title>
</svelte:head>

<div class="space-y-6 animate-fade-in-up">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-display text-xl font-bold text-ink">Gestión de Citas</h1>
			<p class="text-sm text-ink-muted mt-0.5">Vista de Analista</p>
		</div>
		<Button variant="ghost" onclick={exportar}>
			Exportar CSV
		</Button>
	</div>

	<!-- Stats rápidas -->
	<div class="flex flex-wrap gap-4">
		<StatCard title="Total filtradas" value={String(statsTotal)} />
		<StatCard title="Pendientes (página)" value={String(statsPendientes)} />
		<StatCard title="Atendidas (página)" value={String(statsAtendidas)} />
	</div>

	<!-- Filtros -->
	<div class="bg-surface rounded-xl border border-border p-4">
		<AppointmentFilters
			doctores={data.doctores}
			especialidades={data.especialidades}
			value={data.filters}
			onchange={applyFilters}
		/>
	</div>

	<!-- Lista de citas -->
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<!-- Encabezado de tabla -->
		<div class="hidden sm:flex px-4 py-2 bg-surface-elevated border-b border-border text-xs font-medium text-ink-muted uppercase tracking-wider">
			<span class="flex-1">Paciente</span>
			<span class="w-20 text-center">NHM</span>
			<span class="w-32">Doctor</span>
			<span class="w-28">Fecha</span>
			<span class="w-16 text-center">Hora</span>
			<span class="w-28 text-center">Estado</span>
			<span class="w-20 text-center">Acción</span>
		</div>

		{#if data.citas.data.length === 0}
			<div class="p-8">
				<EmptyState
					title="Sin citas"
					description="No hay citas que coincidan con los filtros aplicados."
				/>
			</div>
		{:else if data.citas.total > 50}
			<!-- VirtualList para listas grandes (>50 ítems) -->
			<VirtualList
				items={data.citas.data}
				itemHeight={ROW_HEIGHT}
				containerHeight={LIST_HEIGHT}
			>
				{#snippet row(cita: CitaConPaciente)}
					<div class="flex items-center px-4 h-16 border-b border-border hover:bg-surface-elevated transition-colors">
						<span class="flex-1 text-sm font-medium text-ink truncate">
							{cita.paciente.nombre} {cita.paciente.apellido}
							{#if cita.es_primera_vez}
								<span class="ml-1 text-xs text-viking-600">★</span>
							{/if}
						</span>
						<span class="w-20 text-center text-sm text-ink-muted">{cita.paciente.nhm}</span>
						<span class="w-32 text-sm text-ink-muted truncate">{cita.doctor.nombre} {cita.doctor.apellido}</span>
						<span class="w-28 text-sm text-ink-muted">{cita.fecha}</span>
						<span class="w-16 text-center text-sm text-ink-muted">{cita.hora_inicio}</span>
						<span class="w-28 text-center">
							<AppointmentStatusBadge status={cita.estado} />
						</span>
						<div class="w-20 text-center">
							{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
								<form method="POST" action="?/cancelarCita">
									<input type="hidden" name="citaId" value={cita.id} />
									<button
										type="submit"
										class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline"
										onclick={(e) => { if (!confirm('¿Cancelar esta cita?')) e.preventDefault(); }}
									>
										Cancelar
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/snippet}
			</VirtualList>
		{:else}
			<!-- Lista normal para ≤50 ítems -->
			{#each data.citas.data as cita (cita.id)}
				<div class="flex items-center px-4 h-16 border-b border-border hover:bg-surface-elevated transition-colors last:border-b-0">
					<span class="flex-1 text-sm font-medium text-ink truncate">
						{cita.paciente.nombre} {cita.paciente.apellido}
						{#if cita.es_primera_vez}<span class="ml-1 text-xs text-viking-600">★</span>{/if}
					</span>
					<span class="w-20 text-center text-sm text-ink-muted">{cita.paciente.nhm}</span>
					<span class="w-32 text-sm text-ink-muted truncate">{cita.doctor.nombre} {cita.doctor.apellido}</span>
					<span class="w-28 text-sm text-ink-muted">{cita.fecha}</span>
					<span class="w-16 text-center text-sm text-ink-muted">{cita.hora_inicio}</span>
					<span class="w-28 text-center"><AppointmentStatusBadge status={cita.estado} /></span>
					<div class="w-20 text-center">
						{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
							<form method="POST" action="?/cancelarCita">
								<input type="hidden" name="citaId" value={cita.id} />
								<button type="submit" class="text-xs text-red-600 hover:text-red-800 underline"
									onclick={(e) => { if (!confirm('¿Cancelar esta cita?')) e.preventDefault(); }}>
									Cancelar
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		{/if}

		<!-- Paginación -->
		{#if data.citas.total > data.citas.pageSize}
			<div class="flex items-center justify-between px-4 py-3 border-t border-border">
				<span class="text-xs text-ink-muted">
					{(data.citas.page - 1) * data.citas.pageSize + 1}–{Math.min(data.citas.page * data.citas.pageSize, data.citas.total)} de {data.citas.total}
				</span>
				<div class="flex gap-2">
					<Button variant="ghost" disabled={data.citas.page <= 1} onclick={() => changePage(data.citas.page - 1)}>
						Anterior
					</Button>
					<Button variant="ghost" disabled={!data.citas.hasNext} onclick={() => changePage(data.citas.page + 1)}>
						Siguiente
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
