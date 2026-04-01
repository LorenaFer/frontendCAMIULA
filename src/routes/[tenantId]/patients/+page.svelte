<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';

	let { data }: { data: PageData } = $props();
	const tenantId = $derived($page.params.tenantId);

	let search = $state(data.search ?? '');

	function doSearch() {
		const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
		goto(`/${tenantId}/patients${qs}`, { replaceState: true });
	}

	const relationLabels: Record<string, string> = {
		P: 'Profesor', E: 'Empleado', O: 'Obrero', B: 'Estudiante',
		F: 'Familiar', X: 'Caso especial',
		empleado: 'Empleado', estudiante: 'Estudiante', profesor: 'Profesor', tercero: 'Tercero'
	};
</script>

<svelte:head><title>Pacientes — Dashboard</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold text-ink">Pacientes</h1>
			<p class="text-sm text-ink-muted mt-0.5">Gestión de expedientes y vista 360°</p>
		</div>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
		<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
			<p class="text-xs text-ink-muted">Total pacientes</p>
			<p class="text-2xl font-bold text-ink tabular-nums">{data.stats.totalPacientes}</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
			<p class="text-xs text-ink-muted">Pacientes nuevos</p>
			<p class="text-2xl font-bold text-viking-600 tabular-nums">{data.stats.pacientesNuevos}</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
			<p class="text-xs text-ink-muted">Total citas</p>
			<p class="text-2xl font-bold text-ink tabular-nums">{data.stats.totalCitas}</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
			<p class="text-xs text-ink-muted">Citas atendidas</p>
			<p class="text-2xl font-bold text-sage-600 tabular-nums">{data.stats.citasAtendidas}</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
			<p class="text-xs text-ink-muted">Citas pendientes</p>
			<p class="text-2xl font-bold text-amber-600 tabular-nums">{data.stats.citasPendientes}</p>
		</div>
	</div>

	<!-- Búsqueda -->
	<div class="bg-surface-elevated border border-border/60 rounded-xl p-3 sm:p-4">
		<form onsubmit={(e) => { e.preventDefault(); doSearch(); }} class="flex gap-3">
			<div class="flex-1">
				<Input
					label="Buscar paciente"
					placeholder="Nombre, cédula o NHM..."
					bind:value={search}
				/>
			</div>
			<div class="flex items-end">
				<Button type="submit" variant="primary" size="md">Buscar</Button>
			</div>
		</form>
	</div>

	<!-- Listado de pacientes -->
	<Card padding="none">
		<div class="px-4 py-3 border-b border-border/60 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-ink">
				{data.search ? `Resultados para "${data.search}"` : 'Todos los pacientes'}
				<span class="text-ink-muted font-normal ml-1">({data.patients.length})</span>
			</h2>
		</div>

		{#if data.patients.length > 0}
			<div class="divide-y divide-border/40">
				{#each data.patients as patient (patient.id)}
					<a
						href="/{tenantId}/patients/{patient.id}"
						class="flex items-center gap-4 px-4 py-3.5 hover:bg-canvas-subtle/50 transition-colors"
					>
						<!-- Avatar -->
						<div class="w-10 h-10 rounded-full bg-viking-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
							{patient.nombre[0]}{patient.apellido[0]}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<p class="text-sm font-medium text-ink truncate">{patient.nombre} {patient.apellido}</p>
								{#if patient.es_nuevo}
									<Badge variant="warning" style="soft" size="xs">Nuevo</Badge>
								{/if}
							</div>
							<p class="text-xs text-ink-muted">
								NHM {patient.nhm} · {patient.cedula}
								{#if patient.edad} · {patient.edad} años{/if}
								· {relationLabels[patient.relacion_univ] ?? patient.relacion_univ}
							</p>
						</div>

						<!-- Badges -->
						<div class="hidden sm:flex items-center gap-2 shrink-0">
							{#if patient.tipo_sangre}
								<Badge variant="danger" style="soft" size="xs">{patient.tipo_sangre}</Badge>
							{/if}
							{#if patient.alergias.length > 0}
								<Badge variant="warning" style="soft" size="xs">Alergias</Badge>
							{/if}
						</div>

						<!-- Stats -->
						<div class="hidden md:flex items-center gap-4 shrink-0 text-xs text-ink-muted">
							<div class="text-center">
								<p class="font-bold text-ink tabular-nums">{patient.totalCitas}</p>
								<p>Citas</p>
							</div>
							{#if patient.ultimaCita}
								<div class="text-center">
									<p class="font-medium text-ink">{patient.ultimaCita}</p>
									<p>Última</p>
								</div>
							{/if}
						</div>

						<!-- Chevron -->
						<svg class="w-4 h-4 text-ink-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</a>
				{/each}
			</div>
		{:else}
			<div class="p-6">
				<EmptyState
					title={data.search ? 'Sin resultados' : 'Sin pacientes registrados'}
					description={data.search ? `No se encontraron pacientes para "${data.search}"` : 'Los pacientes se registran al agendar su primera cita.'}
				/>
			</div>
		{/if}
	</Card>
</div>
