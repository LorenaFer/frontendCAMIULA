<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const today = new Intl.DateTimeFormat('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
	const tenantId = $derived($page.params.tenantId);

	// Estadísticas rápidas
	const stats = $derived.by(() => {
		const total = data.citas.length;
		const atendidas = data.citas.filter((c) => c.estado === 'atendida').length;
		const pendientes = data.citas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;
		const noShows = data.citas.filter((c) => c.estado === 'no_asistio').length;
		return { total, atendidas, pendientes, noShows };
	});

	// Modal de cita de emergencia
	let showEmergencia = $state(false);
	let emergenciaCedula = $state('');
	let emergenciaMotivo = $state('');
</script>

<svelte:head>
	<title>Mis Citas de Hoy — Doctor</title>
</svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-ink">Mis Citas de Hoy</h1>
			<p class="text-xs text-ink-muted capitalize mt-0.5">{today}</p>
		</div>
		<Button variant="soft" size="sm" onclick={() => showEmergencia = !showEmergencia}>
			<span class="flex items-center gap-1.5">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
				</svg>
				{showEmergencia ? 'Cancelar' : 'Cita de emergencia'}
			</span>
		</Button>
	</div>

	<!-- Feedback -->
	{#if form?.success && form?.noAsistio}
		<div class="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
			Paciente marcado como no asistió. El slot ha sido liberado.
		</div>
	{/if}
	{#if form?.success && form?.emergencia}
		<div class="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
			Cita de emergencia creada exitosamente.
		</div>
	{/if}

	<!-- Mini stats -->
	{#if data.citas.length > 0}
		<div class="flex gap-3">
			{#each [
				{ label: 'Total', value: stats.total, color: 'text-ink' },
				{ label: 'Pendientes', value: stats.pendientes, color: 'text-amber-600' },
				{ label: 'Atendidas', value: stats.atendidas, color: 'text-emerald-600' },
				{ label: 'No asistieron', value: stats.noShows, color: 'text-red-500' }
			] as stat}
				{#if stat.value > 0 || stat.label === 'Total'}
					<div class="flex items-center gap-1.5 text-xs text-ink-muted">
						<span class="font-bold {stat.color}">{stat.value}</span>
						{stat.label}
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Modal de emergencia -->
	{#if showEmergencia}
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] p-5 animate-fade-in-up">
			<h2 class="text-sm font-semibold text-ink mb-1">Cita de emergencia / Walk-in</h2>
			<p class="text-xs text-ink-muted mb-3">Atender un paciente sin cita previa. Se creará una cita para ahora mismo.</p>
			<form method="POST" action="?/citaEmergencia" use:enhance={() => {
				return async ({ update }) => {
					await update();
					showEmergencia = false;
					emergenciaCedula = '';
					emergenciaMotivo = '';
				};
			}}>
				<div class="flex flex-wrap items-end gap-3">
					<div class="flex-1 min-w-36">
						<Input label="ID Paciente" name="pacienteId" bind:value={emergenciaCedula} placeholder="1" inputSize="sm" />
					</div>
					<div class="flex-1 min-w-48">
						<Input label="Motivo" name="motivo" bind:value={emergenciaMotivo} placeholder="Motivo de la consulta" inputSize="sm" />
					</div>
					<Button type="submit" variant="primary" size="sm">Crear cita</Button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Lista de citas -->
	{#if data.citas.length === 0}
		<div class="bg-surface-elevated rounded-xl border border-border/60 p-8">
			<EmptyState
				title="Sin citas hoy"
				description="No tiene consultas programadas para el día de hoy."
			/>
		</div>
	{:else}
		<div class="space-y-2">
			{#each data.citas as cita (cita.id)}
				<div class="bg-surface-elevated rounded-xl border border-border/60 p-4 flex flex-wrap gap-4 items-center hover:shadow-[var(--shadow-1)] transition-shadow {cita.estado === 'no_asistio' ? 'opacity-60' : ''}">
					<!-- Hora -->
					<div class="w-14 text-center shrink-0">
						<p class="text-base font-mono font-bold text-ink">{cita.hora_inicio}</p>
						<p class="text-[10px] text-ink-muted">{cita.duracion_min} min</p>
					</div>

					<!-- Barra de color según estado -->
					<div class="w-0.5 h-10 rounded-full shrink-0 hidden sm:block {
						cita.estado === 'atendida' ? 'bg-emerald-400' :
						cita.estado === 'no_asistio' ? 'bg-red-400' :
						cita.estado === 'cancelada' ? 'bg-border' :
						'bg-viking-400'
					}"></div>

					<!-- Datos del paciente -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<p class="font-semibold text-sm text-ink truncate">
								{cita.paciente.nombre} {cita.paciente.apellido}
							</p>
							{#if cita.es_primera_vez}
								<span class="shrink-0 text-[10px] bg-viking-50 dark:bg-viking-900/20 text-viking-700 dark:text-viking-300 px-1.5 py-0.5 rounded font-medium">
									1ª vez
								</span>
							{/if}
						</div>
						<p class="text-xs text-ink-muted">NHM: {cita.paciente.nhm} · {cita.paciente.cedula}</p>
						{#if cita.motivo_consulta}
							<p class="text-[11px] text-ink-subtle mt-0.5 truncate">{cita.motivo_consulta}</p>
						{/if}
					</div>

					<!-- Estado -->
					<div class="shrink-0">
						<AppointmentStatusBadge status={cita.estado} />
					</div>

					<!-- Acciones -->
					<div class="flex gap-1.5 shrink-0">
						<a
							href="/{tenantId}/doctor/citas/{cita.id}"
							class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors"
						>
							Evaluación
						</a>

						{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
							<form method="POST" action="?/marcarAtendida" use:enhance>
								<input type="hidden" name="citaId" value={cita.id} />
								<button
									type="submit"
									class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
								>
									Atendida
								</button>
							</form>

							<form method="POST" action="?/marcarNoAsistio" use:enhance>
								<input type="hidden" name="citaId" value={cita.id} />
								<button
									type="submit"
									class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
									title="Marcar como no asistió — libera el horario"
								>
									No asistió
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
