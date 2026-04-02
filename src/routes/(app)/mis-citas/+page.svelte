<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { CitaConPaciente } from '$shared/types/appointments.js';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let cancellingCita = $state<CitaConPaciente | null>(null);

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

<div class="space-y-4 animate-fade-in-up">
	<!-- Header compacto -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-ink">Mis Citas</h1>
		<a
			href="/agendar"
			class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors shadow-sm"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
			Agendar nueva cita
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
						<div class="bg-surface-elevated border border-border/60 rounded-xl p-3 sm:p-4 hover:shadow-[var(--shadow-1)] transition-shadow">
							<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
								<div class="flex-1 min-w-0">
									<div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
										<p class="text-sm font-semibold text-ink">
											{cita.fecha === hoy ? 'Hoy' : formatFecha(cita.fecha)}
										</p>
										<span class="text-xs text-ink-muted font-mono">{cita.hora_inicio}–{cita.hora_fin}</span>
										<AppointmentStatusBadge status={cita.estado} />
									</div>
									<p class="text-xs text-ink-muted truncate">
										{cita.doctor.especialidad.nombre} — Dr. {cita.doctor.nombre} {cita.doctor.apellido}
									</p>
									{#if cita.motivo_consulta}
										<p class="text-xs text-ink-subtle mt-1 truncate">{cita.motivo_consulta}</p>
									{/if}
								</div>
								<div class="hidden sm:block text-right shrink-0">
									<p class="text-lg font-mono font-bold text-viking-600">{cita.hora_inicio}</p>
									<p class="text-xs text-ink-muted">{cita.duracion_min} min</p>
								</div>
							</div>
							<!-- Acciones del paciente -->
							<div class="mt-3 flex gap-2 pt-2 border-t border-border/40">
								<Button
									type="button"
									variant="ghost"
									size="md"
									onclick={() => { cancellingCita = cita; }}
								>
									Cancelar cita
								</Button>
								<a
									href="/agendar"
									class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-viking-600 hover:bg-viking-50 dark:hover:bg-viking-900/20 transition-colors"
								>
									Reagendar
								</a>
							</div>

							{#if cita.observaciones}
								<div class="mt-2 px-2.5 py-1.5 bg-canvas-subtle rounded-lg">
									<p class="text-xs text-ink-muted uppercase tracking-wider mb-0.5">Observaciones</p>
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
						<div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-elevated border border-border/40 rounded-lg {cita.estado === 'cancelada' || cita.estado === 'no_asistio' ? 'opacity-60' : ''}">
							<div class="w-10 sm:w-12 text-center shrink-0">
								<p class="text-xs font-mono font-medium text-ink">{cita.hora_inicio}</p>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-ink truncate">
									<span class="font-medium">{formatFecha(cita.fecha)}</span>
									<span class="hidden sm:inline"> — {cita.doctor.especialidad.nombre}, Dr. {cita.doctor.nombre} {cita.doctor.apellido}</span>
								</p>
								<p class="sm:hidden text-xs text-ink-muted truncate">{cita.doctor.especialidad.nombre}</p>
							</div>
							<AppointmentStatusBadge status={cita.estado} />
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Dialog de confirmación de cancelación -->
{#if cancellingCita}
	{@const cita = cancellingCita}
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
						cancellingCita = null;
						await invalidateAll();
						toastWarning('Cita cancelada', 'Su cita fue cancelada correctamente. Puede agendar una nueva cuando lo desee.');
					} else {
						toastError('Error', 'No se pudo cancelar la cita. Intente nuevamente.');
					}
				};
			}}
		>
			<input type="hidden" name="citaId" value={cita.id} />
			<DialogBody>
				<p class="text-sm text-ink mb-3">
					¿Está seguro de que desea cancelar esta cita?
				</p>
				<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3 space-y-1 text-sm">
					<p class="font-medium text-ink">{cita.fecha === hoy ? 'Hoy' : formatFecha(cita.fecha)} · {cita.hora_inicio}–{cita.hora_fin}</p>
					<p class="text-ink-muted">{cita.doctor.especialidad.nombre} — Dr. {cita.doctor.nombre} {cita.doctor.apellido}</p>
				</div>
				<p class="text-sm text-honey-700 dark:text-honey-400 mt-3">
					Deberá agendar una nueva cita si desea ser atendido.
				</p>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={() => { cancellingCita = null; }}>No cancelar</Button>
				<Button type="submit" variant="danger" size="md">Sí, cancelar cita</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
