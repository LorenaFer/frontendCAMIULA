<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { CitaConPaciente } from '$shared/types/appointments.js';
	import type { HistorialPrevioEntry } from '$shared/types/medical-records.js';
	import type { Prescription } from '$shared/types/inventory.js';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastError, toastWarning, toastSuccess } from '$shared/components/toast/toast.svelte.js';
	import { onMount } from 'svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	onMount(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.get('agendada') === '1') {
			toastSuccess('Cita agendada', 'Su cita fue registrada exitosamente.');
			url.searchParams.delete('agendada');
			history.replaceState({}, '', url.pathname);
		}
	});

	let cancellingCita = $state<CitaConPaciente | null>(null);

	const proximas = $derived(
		(data.citas as CitaConPaciente[]).filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada')
	);
	const pasadas = $derived(
		(data.citas as CitaConPaciente[]).filter((c) => c.estado === 'atendida' || c.estado === 'no_asistio' || c.estado === 'cancelada')
	);
	const historias = $derived(data.historias as HistorialPrevioEntry[]);
	const recetas = $derived(data.recetas as Prescription[]);

	function formatFecha(fecha: string) {
		const d = new Date(fecha + 'T12:00:00');
		return new Intl.DateTimeFormat('es-VE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d);
	}

	function formatFechaCorta(fecha: string) {
		const d = new Date(fecha + 'T12:00:00');
		return new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short' }).format(d);
	}

	const hoy = new Date().toISOString().slice(0, 10);

	const prescriptionStatusLabel: Record<string, string> = {
		draft: 'Borrador', issued: 'Emitida', dispensed: 'Despachada', cancelled: 'Cancelada'
	};
	const prescriptionStatusVariant: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
		draft: 'warning', issued: 'info', dispensed: 'success', cancelled: 'danger'
	};
</script>

<svelte:head><title>Mi Portal — Centro Ambulatorio ULA</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">

	<!-- ═══ ACCIONES RÁPIDAS ═══ -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<a
			href="/agendar"
			class="group bg-viking-600 text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-viking-700 transition-colors shadow-sm col-span-2 sm:col-span-1"
		>
			<svg class="w-7 h-7 opacity-90 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			<span class="text-sm font-semibold">Agendar cita</span>
		</a>

		<div class="bg-surface-elevated border border-border/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
			<p class="text-2xl font-bold font-mono text-viking-600">{proximas.length}</p>
			<p class="text-xs text-ink-muted text-center">Citas pendientes</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
			<p class="text-2xl font-bold font-mono text-iris-600 dark:text-iris-400">{recetas.length}</p>
			<p class="text-xs text-ink-muted text-center">Recetas</p>
		</div>
		<div class="bg-surface-elevated border border-border/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
			<p class="text-2xl font-bold font-mono text-sage-600 dark:text-sage-400">{historias.length}</p>
			<p class="text-xs text-ink-muted text-center">Consultas</p>
		</div>
	</div>

	<!-- ═══ PRÓXIMAS CITAS ═══ -->
	<section>
		<h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
			<span class="w-2 h-2 rounded-full bg-viking-500"></span>
			Próximas citas
		</h2>

		{#if proximas.length === 0}
			<div class="bg-surface-elevated border border-border/60 rounded-xl p-5 text-center">
				<p class="text-sm text-ink-muted mb-3">No tiene citas próximas</p>
				<a
					href="/agendar"
					class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
					Agendar ahora
				</a>
			</div>
		{:else}
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
						<div class="mt-3 flex gap-2 pt-2 border-t border-border/40">
							<Button type="button" variant="ghost" size="md" onclick={() => { cancellingCita = cita; }}>
								Cancelar cita
							</Button>
							<a href="/agendar" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-viking-600 hover:bg-viking-50 dark:hover:bg-viking-900/20 transition-colors">
								Reagendar
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- ═══ GRID: HISTORIAL MÉDICO + RECETAS ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

		<!-- Historia Médica -->
		<section>
			<h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
				<svg class="w-4 h-4 text-sage-600 dark:text-sage-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Historial de consultas
			</h2>

			{#if historias.length === 0}
				<div class="bg-surface-elevated border border-border/60 rounded-xl p-5 text-center">
					<p class="text-xs text-ink-muted">Sin consultas registradas</p>
				</div>
			{:else}
				<div class="bg-surface-elevated border border-border/60 rounded-xl divide-y divide-border/40 overflow-hidden">
					{#each historias as historia (historia.id)}
						<div class="px-4 py-3 hover:bg-canvas-subtle/50 transition-colors">
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-0.5">
										<p class="text-sm font-medium text-ink">{formatFechaCorta(historia.fecha)}</p>
										<Badge variant="info" style="soft" size="sm">{historia.especialidad}</Badge>
									</div>
									<p class="text-xs text-ink-muted">Dr. {historia.doctor_nombre}</p>
									{#if historia.diagnostico_descripcion}
										<p class="text-xs text-ink-subtle mt-1 line-clamp-2">{historia.diagnostico_descripcion}</p>
									{/if}
								</div>
								{#if historia.diagnostico_cie10}
									<span class="text-xs font-mono text-ink-subtle shrink-0">{historia.diagnostico_cie10}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Recetas Médicas -->
		<section>
			<h2 class="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
				<svg class="w-4 h-4 text-iris-600 dark:text-iris-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
				Recetas médicas
			</h2>

			{#if recetas.length === 0}
				<div class="bg-surface-elevated border border-border/60 rounded-xl p-5 text-center">
					<p class="text-xs text-ink-muted">Sin recetas registradas</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each recetas as receta (receta.id)}
						<div class="bg-surface-elevated border border-border/60 rounded-xl overflow-hidden">
							<!-- Header -->
							<div class="px-4 py-2.5 flex items-center justify-between border-b border-border/40">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-ink font-mono">{receta.prescription_number}</span>
									<span class="text-xs text-ink-muted">{formatFechaCorta(receta.prescription_date)}</span>
								</div>
								<Badge
									variant={prescriptionStatusVariant[receta.prescription_status] ?? 'info'}
									style="soft"
									size="sm"
								>
									{prescriptionStatusLabel[receta.prescription_status] ?? receta.prescription_status}
								</Badge>
							</div>
							<!-- Items -->
							<div class="divide-y divide-border/30">
								{#each receta.items as item (item.id)}
									<div class="px-4 py-2 flex items-start gap-2.5">
										<div class="w-1.5 h-1.5 rounded-full bg-sage-500 shrink-0 mt-1.5"></div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-ink">{item.medication.generic_name}</p>
											<p class="text-xs text-ink-muted">
												{item.medication.pharmaceutical_form} · {item.quantity_prescribed} {item.medication.unit_measure}
												{#if item.duration_days} · {item.duration_days} días{/if}
											</p>
											{#if item.dosage_instructions}
												<p class="text-xs text-ink-subtle mt-0.5">{item.dosage_instructions}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>

	<!-- ═══ HISTORIAL DE CITAS (abajo, compacto) ═══ -->
	{#if pasadas.length > 0}
		<section>
			<h2 class="text-sm font-semibold text-ink-muted mb-3">Historial de citas ({pasadas.length})</h2>
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
		</section>
	{/if}
</div>

<!-- Dialog cancelación -->
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
				<p class="text-sm text-ink mb-3">¿Está seguro de que desea cancelar esta cita?</p>
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
