<script lang="ts">
	import type { PageData } from './$types';
	import type { CitaConPaciente } from '$shared/types/appointments.js';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();
	const tenantId = $derived($page.params.tenantId);

	// Agrupar citas por estado
	const proximas = $derived(
		(data.citas as CitaConPaciente[]).filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada')
	);
	const pasadas = $derived(
		(data.citas as CitaConPaciente[]).filter((c) => c.estado === 'atendida' || c.estado === 'no_asistio' || c.estado === 'cancelada')
	);

	function formatFecha(fecha: string) {
		const d = new Date(fecha + 'T12:00:00');
		return new Intl.DateTimeFormat('es-VE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
	}

	const hoy = new Date().toISOString().slice(0, 10);
</script>

<svelte:head><title>Mis Citas</title></svelte:head>

<div class="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-ink">Mis Citas</h1>
			<p class="text-xs text-ink-muted mt-0.5">Historial de citas médicas</p>
		</div>
		<a
			href="/{tenantId}/agendar"
			class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors"
		>
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
			Nueva cita
		</a>
	</div>

	{#if data.citas.length === 0}
		<div class="bg-surface-elevated border border-border/60 rounded-xl p-8">
			<EmptyState
				title="Sin citas registradas"
				description="Aún no tiene citas agendadas. Use el botón 'Nueva cita' para agendar."
			/>
		</div>
	{:else}
		<!-- Próximas citas -->
		{#if proximas.length > 0}
			<div>
				<h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full bg-viking-500"></span>
					Próximas citas ({proximas.length})
				</h2>
				<div class="space-y-2">
					{#each proximas as cita (cita.id)}
						<div class="bg-surface-elevated border border-border/60 rounded-xl p-4 hover:shadow-[var(--shadow-1)] transition-shadow">
							<div class="flex items-start justify-between gap-3">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<p class="text-sm font-semibold text-ink">
											{cita.fecha === hoy ? 'Hoy' : formatFecha(cita.fecha)}
										</p>
										<span class="text-xs text-ink-muted font-mono">{cita.hora_inicio}–{cita.hora_fin}</span>
										<AppointmentStatusBadge status={cita.estado} />
									</div>
									<p class="text-xs text-ink-muted">
										{cita.doctor.especialidad.nombre} — Dr. {cita.doctor.nombre} {cita.doctor.apellido}
									</p>
									{#if cita.motivo_consulta}
										<p class="text-[11px] text-ink-subtle mt-1">{cita.motivo_consulta}</p>
									{/if}
								</div>
								<div class="text-right shrink-0">
									<p class="text-lg font-mono font-bold text-viking-600">{cita.hora_inicio}</p>
									<p class="text-[10px] text-ink-muted">{cita.duracion_min} min</p>
								</div>
							</div>
							{#if cita.observaciones}
								<div class="mt-2 px-2.5 py-1.5 bg-canvas-subtle rounded-lg">
									<p class="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">Observaciones</p>
									<p class="text-xs text-ink">{cita.observaciones}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Historial -->
		{#if pasadas.length > 0}
			<div>
				<h2 class="text-sm font-semibold text-ink-muted mb-3">Historial ({pasadas.length})</h2>
				<div class="space-y-1.5">
					{#each pasadas as cita (cita.id)}
						<div class="flex items-center gap-3 px-4 py-2.5 bg-surface-elevated border border-border/40 rounded-lg {cita.estado === 'cancelada' || cita.estado === 'no_asistio' ? 'opacity-60' : ''}">
							<div class="w-12 text-center shrink-0">
								<p class="text-xs font-mono font-medium text-ink">{cita.hora_inicio}</p>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-ink truncate">
									<span class="font-medium">{formatFecha(cita.fecha)}</span>
									— {cita.doctor.especialidad.nombre}, Dr. {cita.doctor.nombre} {cita.doctor.apellido}
								</p>
								{#if cita.motivo_consulta}
									<p class="text-[10px] text-ink-subtle truncate">{cita.motivo_consulta}</p>
								{/if}
							</div>
							<AppointmentStatusBadge status={cita.estado} />
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
