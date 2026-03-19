<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { CitaConPaciente } from '$shared/types/appointments.js';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const today = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
	const tenantId = $derived($page.params.tenantId);

	// ─── Time helpers ────────────────────────────────────────
	const HORA_MIN = 7, HORA_MAX = 19, TOTAL_MIN = 720;
	const horasEje = Array.from({ length: 12 }, (_, i) => i + 7);

	function t2p(t: string) {
		const [h, m] = t.split(':').map(Number);
		return Math.max(0, Math.min(100, ((h * 60 + m - HORA_MIN * 60) / TOTAL_MIN) * 100));
	}

	// ─── Stats ───────────────────────────────────────────────
	const stats = $derived.by(() => {
		const t = data.citas.length;
		const p = data.citas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;
		const a = data.citas.filter((c) => c.estado === 'atendida').length;
		const n = data.citas.filter((c) => c.estado === 'no_asistio').length;
		return { total: t, pendientes: p, atendidas: a, noShows: n };
	});

	// ─── Current time indicator ──────────────────────────────
	const nowPercent = $derived.by(() => {
		const now = new Date();
		const mins = now.getHours() * 60 + now.getMinutes();
		return Math.max(0, Math.min(100, ((mins - HORA_MIN * 60) / TOTAL_MIN) * 100));
	});

	// ─── Selected appointment (detail panel) ─────────────────
	let selected = $state<CitaConPaciente | null>(null);

	// Status colors for blocks
	function citaColor(estado: string) {
		switch (estado) {
			case 'atendida': return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300/60 dark:border-emerald-700/50';
			case 'no_asistio': return 'bg-red-50 dark:bg-red-900/20 border-red-300/60 dark:border-red-700/50 opacity-50';
			case 'cancelada': return 'bg-canvas-subtle border-border/40 opacity-40';
			default: return 'bg-viking-100 dark:bg-viking-900/30 border-viking-300/60 dark:border-viking-700/50';
		}
	}
	function citaTextColor(estado: string) {
		switch (estado) {
			case 'atendida': return 'text-emerald-800 dark:text-emerald-200';
			case 'no_asistio': return 'text-red-700 dark:text-red-300';
			case 'cancelada': return 'text-ink-subtle';
			default: return 'text-viking-800 dark:text-viking-200';
		}
	}

	// Emergency form
	let showEmergencia = $state(false);
	let emergPaciente = $state('');
	let emergMotivo = $state('');
</script>

<svelte:head><title>Mis Citas — Doctor</title></svelte:head>

<div class="space-y-4 animate-fade-in-up">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-ink">Agenda del Día</h1>
			<p class="text-xs text-ink-muted capitalize mt-0.5">{today} — Dr. {data.doctorNombre}</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- Mini stats -->
			<div class="hidden sm:flex items-center gap-3 text-xs text-ink-muted">
				<span><b class="text-ink">{stats.total}</b> citas</span>
				{#if stats.pendientes > 0}<span><b class="text-amber-600">{stats.pendientes}</b> pend.</span>{/if}
				{#if stats.atendidas > 0}<span><b class="text-emerald-600">{stats.atendidas}</b> atend.</span>{/if}
				{#if stats.noShows > 0}<span><b class="text-red-500">{stats.noShows}</b> no asist.</span>{/if}
			</div>
			<Button variant="soft" size="sm" onclick={() => { showEmergencia = !showEmergencia; selected = null; }}>
				<span class="flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
					Emergencia
				</span>
			</Button>
		</div>
	</div>

	<!-- Feedback -->
	{#if form?.success && form?.noAsistio}
		<div class="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">Paciente marcado como no asistió. Slot liberado.</div>
	{/if}
	{#if form?.success && form?.emergencia}
		<div class="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">Cita de emergencia creada.</div>
	{/if}

	<!-- Main layout: Calendar + Detail Panel -->
	<div class="flex gap-4">
		<!-- Calendar column -->
		<div class="flex-1 min-w-0 bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] overflow-hidden select-none">
			<!-- Calendar grid -->
			<div class="grid grid-cols-[2.5rem_1fr] relative" style="height: 560px;">
				<!-- Hour axis -->
				<div class="relative border-r border-border/20">
					{#each horasEje as hora}
						<div class="absolute right-1.5 text-[9px] text-ink-subtle tabular-nums -translate-y-1/2" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%">{String(hora).padStart(2, '0')}</div>
					{/each}
				</div>

				<!-- Day column -->
				<div class="relative">
					<!-- Hour lines -->
					{#each horasEje as hora}
						<div class="absolute inset-x-0 border-t border-border/15" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
						<div class="absolute inset-x-0 border-t border-border/8 border-dashed" style="top: {((hora - HORA_MIN + 0.5) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
					{/each}

					<!-- Availability blocks (background) -->
					{#each data.disponibilidad as bloque}
						{@const top = t2p(bloque.hora_inicio)}
						{@const height = t2p(bloque.hora_fin) - top}
						<div
							class="absolute inset-x-0 bg-viking-50/40 dark:bg-viking-950/20"
							style="top: {top}%; height: {height}%;"
						></div>
					{/each}

					<!-- Current time indicator -->
					{#if nowPercent > 0 && nowPercent < 100}
						<div class="absolute inset-x-0 z-20 flex items-center" style="top: {nowPercent}%;">
							<div class="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0"></div>
							<div class="flex-1 border-t border-red-500"></div>
						</div>
					{/if}

					<!-- Appointment blocks -->
					{#each data.citas as cita (cita.id)}
						{@const top = t2p(cita.hora_inicio)}
						{@const height = t2p(cita.hora_fin) - top}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute left-1 right-1 rounded border cursor-pointer transition-all {citaColor(cita.estado)} {selected?.id === cita.id ? 'ring-2 ring-viking-400 z-10' : 'hover:ring-1 hover:ring-viking-300'}"
							style="top: {top}%; height: {height}%; min-height: 24px;"
							onclick={() => { selected = cita; showEmergencia = false; }}
						>
							<div class="px-2 py-1 h-full overflow-hidden">
								<div class="flex items-center gap-1.5">
									<p class="text-[11px] font-semibold {citaTextColor(cita.estado)} truncate">
										{cita.paciente.nombre} {cita.paciente.apellido}
									</p>
									{#if cita.es_primera_vez}
										<span class="text-[8px] bg-white/60 dark:bg-black/20 px-1 rounded font-medium shrink-0">1ª</span>
									{/if}
								</div>
								<p class="text-[9px] {citaTextColor(cita.estado)} opacity-70">{cita.hora_inicio}–{cita.hora_fin} · {cita.motivo_consulta || 'Sin motivo'}</p>
							</div>
						</div>
					{/each}

					<!-- Empty state -->
					{#if data.citas.length === 0}
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="text-center">
								<p class="text-sm text-ink-muted">Sin citas hoy</p>
								<p class="text-[10px] text-ink-subtle mt-0.5">Use "Emergencia" para agregar una cita walk-in</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Detail Panel (right side) -->
		<div class="hidden lg:block w-72 xl:w-80 shrink-0">
			{#if showEmergencia}
				<!-- Emergency form -->
				<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] p-4 animate-fade-in-up">
					<h3 class="text-sm font-semibold text-ink mb-1">Cita de Emergencia</h3>
					<p class="text-[10px] text-ink-muted mb-3">Se creará para ahora mismo (30 min).</p>
					<form method="POST" action="?/citaEmergencia" use:enhance={() => { return async ({ update }) => { await update(); showEmergencia = false; emergPaciente = ''; emergMotivo = ''; }; }}>
						<div class="space-y-2.5">
							<Input label="ID Paciente" name="pacienteId" bind:value={emergPaciente} placeholder="1" inputSize="sm" />
							<Input label="Motivo" name="motivo" bind:value={emergMotivo} placeholder="Motivo de consulta" inputSize="sm" />
							<Button type="submit" variant="primary" size="sm" fullWidth>Crear cita</Button>
						</div>
					</form>
				</div>

			{:else if selected}
				<!-- Appointment detail -->
				<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] overflow-hidden animate-fade-in-up">
					<!-- Header con estado -->
					<div class="px-4 py-3 border-b border-border/40 flex items-center justify-between">
						<h3 class="text-sm font-semibold text-ink">Detalle de Cita</h3>
						<AppointmentStatusBadge status={selected.estado} />
					</div>

					<div class="p-4 space-y-3">
						<!-- Hora -->
						<div class="flex items-center gap-2">
							<svg class="w-4 h-4 text-ink-muted shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
							<div>
								<p class="text-sm font-medium text-ink">{selected.hora_inicio} — {selected.hora_fin}</p>
								<p class="text-[10px] text-ink-muted">{selected.duracion_min} min{selected.es_primera_vez ? ' · Primera consulta' : ''}</p>
							</div>
						</div>

						<!-- Paciente -->
						<div class="flex items-start gap-2">
							<svg class="w-4 h-4 text-ink-muted shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
							<div>
								<p class="text-sm font-medium text-ink">{selected.paciente.nombre} {selected.paciente.apellido}</p>
								<p class="text-[10px] text-ink-muted">NHM: {selected.paciente.nhm} · {selected.paciente.cedula}</p>
							</div>
						</div>

						<!-- Motivo -->
						{#if selected.motivo_consulta}
							<div class="flex items-start gap-2">
								<svg class="w-4 h-4 text-ink-muted shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
								<div>
									<p class="text-[10px] text-ink-muted uppercase tracking-wider">Motivo</p>
									<p class="text-xs text-ink mt-0.5">{selected.motivo_consulta}</p>
								</div>
							</div>
						{/if}

						<!-- Observaciones -->
						{#if selected.observaciones}
							<div class="px-2.5 py-2 bg-canvas-subtle rounded-lg">
								<p class="text-[10px] text-ink-muted uppercase tracking-wider mb-0.5">Observaciones</p>
								<p class="text-xs text-ink">{selected.observaciones}</p>
							</div>
						{/if}

						<!-- Datos médicos del paciente -->
						{#if selected.paciente.datos_medicos?.tipo_sangre || selected.paciente.datos_medicos?.alergias?.length}
							<div class="border-t border-border/40 pt-2.5">
								<p class="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Info médica</p>
								<div class="flex flex-wrap gap-1.5">
									{#if selected.paciente.datos_medicos.tipo_sangre}
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium">{selected.paciente.datos_medicos.tipo_sangre}</span>
									{/if}
									{#if selected.paciente.datos_medicos.alergias?.length}
										{#each selected.paciente.datos_medicos.alergias as alergia}
											<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">⚠ {alergia}</span>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="px-4 pb-4 space-y-2">
						<a
							href="/{tenantId}/doctor/citas/{selected.id}"
							class="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
							Evaluación médica
						</a>

						{#if selected.estado === 'pendiente' || selected.estado === 'confirmada'}
							<div class="flex gap-2">
								<form method="POST" action="?/marcarAtendida" use:enhance class="flex-1">
									<input type="hidden" name="citaId" value={selected.id} />
									<button type="submit" class="w-full px-3 py-2 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
										Atendida
									</button>
								</form>
								<form method="POST" action="?/marcarNoAsistio" use:enhance class="flex-1">
									<input type="hidden" name="citaId" value={selected.id} />
									<button type="submit" class="w-full px-3 py-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
										No asistió
									</button>
								</form>
							</div>
						{/if}

						<button
							onclick={() => selected = null}
							class="w-full text-center text-[10px] text-ink-subtle hover:text-ink-muted transition-colors py-1"
						>
							Cerrar detalle
						</button>
					</div>
				</div>

			{:else}
				<!-- Empty panel -->
				<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] p-4">
					<p class="text-xs text-ink-muted text-center">Seleccione una cita en el calendario para ver sus detalles</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Legend -->
	<div class="flex items-center gap-4 text-[10px] text-ink-subtle px-1">
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded bg-viking-50/40 dark:bg-viking-950/20 border border-border/30"></span>
			Horario de atención
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded bg-viking-100 dark:bg-viking-900/30 border border-viking-300/50"></span>
			Pendiente
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300/50"></span>
			Atendida
		</div>
		<div class="flex items-center gap-1.5">
			<div class="w-2 h-2 rounded-full bg-red-500"></div>
			Hora actual
		</div>
	</div>
</div>
