<script lang="ts">
	import type { PageData } from './$types';
	import type { CitaConPaciente } from '$shared/types/appointments.js';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	const today = new Intl.DateTimeFormat('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

	const tenantId = $derived($page.params.tenantId);
</script>

<svelte:head>
	<title>Mis Citas de Hoy — Doctor</title>
</svelte:head>

<div class="space-y-6 animate-fade-in-up">
	<div>
		<h1 class="text-display text-xl font-bold text-ink">Mis Citas de Hoy</h1>
		<p class="text-sm text-ink-muted capitalize mt-0.5">{today}</p>
	</div>

	{#if data.citas.length === 0}
		<div class="bg-surface rounded-xl border border-border p-8">
			<EmptyState
				title="Sin citas hoy"
				description="No tiene consultas programadas para el día de hoy."
			/>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.citas as cita (cita.id)}
				<div class="bg-surface rounded-xl border border-border p-4 flex flex-wrap gap-4 items-center hover:shadow-[var(--shadow-2)] transition-shadow">
					<!-- Hora -->
					<div class="w-16 text-center shrink-0">
						<p class="text-lg font-mono font-bold text-ink">{cita.hora_inicio}</p>
						<p class="text-xs text-ink-muted">{cita.duracion_min} min</p>
					</div>

					<!-- Separador visual -->
					<div class="w-px h-10 bg-border shrink-0 hidden sm:block"></div>

					<!-- Datos del paciente -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<p class="font-semibold text-ink truncate">
								{cita.paciente.nombre} {cita.paciente.apellido}
							</p>
							{#if cita.es_primera_vez}
								<span class="shrink-0 text-xs bg-viking-100 dark:bg-viking-900/30 text-viking-700 dark:text-viking-300 px-1.5 py-0.5 rounded font-medium">
									1ª consulta
								</span>
							{/if}
						</div>
						<p class="text-sm text-ink-muted">NHM: {cita.paciente.nhm} · {cita.paciente.cedula}</p>
						{#if cita.motivo_consulta}
							<p class="text-xs text-ink-muted mt-0.5 truncate">{cita.motivo_consulta}</p>
						{/if}
					</div>

					<!-- Estado -->
					<div class="shrink-0">
						<AppointmentStatusBadge status={cita.estado} />
					</div>

					<!-- Acciones -->
					<div class="flex gap-2 shrink-0">
						<a
							href="/{tenantId}/doctor/citas/{cita.id}"
							class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors"
						>
							Ver evaluación
						</a>
						{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
							<form method="POST" action="?/marcarAtendida">
								<input type="hidden" name="citaId" value={cita.id} />
								<button
									type="submit"
									class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-ink hover:bg-surface-elevated transition-colors"
								>
									Marcar atendida
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
