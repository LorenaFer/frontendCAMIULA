<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { CitaConPaciente } from '$domain/appointments/types.js';
	import AppointmentStatusBadge from '$domain/appointments/components/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { enhance, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toastSuccess, toastError, toastWarning } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const today = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
	// Time helpers
	const HORA_MIN = 7, HORA_MAX = 19, TOTAL_MIN = 720;
	const horasEje = Array.from({ length: 12 }, (_, i) => i + 7);
	function t2p(t: string) { const [h, m] = t.split(':').map(Number); return Math.max(0, Math.min(100, ((h * 60 + m - HORA_MIN * 60) / TOTAL_MIN) * 100)); }

	// Stats
	const stats = $derived.by(() => {
		const t = data.citas.length;
		const p = data.citas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmada').length;
		const a = data.citas.filter((c) => c.estado === 'atendida').length;
		const n = data.citas.filter((c) => c.estado === 'no_asistio').length;
		return { total: t, pendientes: p, atendidas: a, noShows: n };
	});

	// Current time
	const nowPercent = $derived.by(() => {
		const now = new Date();
		return Math.max(0, Math.min(100, ((now.getHours() * 60 + now.getMinutes() - HORA_MIN * 60) / TOTAL_MIN) * 100));
	});

	// Selected appointment
	let selected = $state<CitaConPaciente | null>(null);

	function citaColor(estado: string) {
		return estado === 'atendida' ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300/60 dark:border-emerald-700/50' :
			estado === 'no_asistio' ? 'bg-red-50 dark:bg-red-900/20 border-red-300/60 dark:border-red-700/50 opacity-50' :
			estado === 'cancelada' ? 'bg-canvas-subtle border-border/40 opacity-40' :
			'bg-viking-100 dark:bg-viking-900/30 border-viking-300/60 dark:border-viking-700/50';
	}
	function citaTextColor(estado: string) {
		return estado === 'atendida' ? 'text-emerald-800 dark:text-emerald-200' :
			estado === 'no_asistio' ? 'text-red-700 dark:text-red-300' :
			estado === 'cancelada' ? 'text-ink-subtle' :
			'text-viking-800 dark:text-viking-200';
	}

	// Emergencia state
	let showEmergencia = $state(false);
	let emergQuery = $state('');
	let emergPaciente = $state<{ id: string; nombre: string; apellido: string; nhm: number } | null>(null);
	let emergMotivo = $state('');
	let emergHoraInicio = $state('');
	let emergDuracion = $state('30');
	let emergSearching = $state(false);
	let emergError = $state('');

	// Generar opciones de hora (cada 30 min desde ahora hasta 18:00)
	const emergHoraOpciones = $derived.by(() => {
		const now = new Date();
		const currentMin = now.getHours() * 60 + now.getMinutes();
		const opts = [{ value: '', label: 'Ahora mismo' }];
		for (let m = Math.ceil(currentMin / 30) * 30; m < 18 * 60; m += 30) {
			const h = Math.floor(m / 60);
			const min = m % 60;
			const t = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
			opts.push({ value: t, label: t });
		}
		return opts;
	});

	async function buscarPacienteEmergencia() {
		if (!emergQuery.trim()) { emergError = 'Ingrese NHM o cédula'; return; }
		emergError = '';
		emergSearching = true;
		try {
			const fd = new FormData();
			fd.set('query', emergQuery.trim());
			const res = await fetch('?/buscarPacienteEmergencia', { method: 'POST', body: fd });
			const result = deserialize(await res.text());
			if (result.type === 'success' && result.data?.pacienteFound) {
				emergPaciente = result.data.paciente as typeof emergPaciente;
			} else if (result.type === 'failure') {
				emergError = (result.data as { error?: string })?.error ?? 'Paciente no encontrado';
				emergPaciente = null;
			}
		} catch {
			emergError = 'Error de conexión';
		} finally {
			emergSearching = false;
		}
	}

	function resetEmergencia() {
		showEmergencia = false;
		emergQuery = '';
		emergPaciente = null;
		emergMotivo = '';
		emergHoraInicio = '';
		emergDuracion = '30';
		emergError = '';
	}
</script>

<svelte:head><title>Mis Citas — Doctor</title></svelte:head>

<div class="space-y-3 sm:space-y-4 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
		<div>
			<h1 class="text-lg sm:text-xl font-bold text-ink">Agenda del Día</h1>
			<p class="text-xs text-ink-muted capitalize mt-0.5">{today} — Dr. {data.doctorNombre}</p>
		</div>
		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Stats: compact on mobile -->
			<div class="flex items-center gap-2 sm:gap-3 text-xs text-ink-muted">
				<span><b class="text-ink">{stats.total}</b> citas</span>
				{#if stats.pendientes > 0}<span><b class="text-amber-600">{stats.pendientes}</b> pend.</span>{/if}
				{#if stats.atendidas > 0}<span class="hidden sm:inline"><b class="text-emerald-600">{stats.atendidas}</b> atend.</span>{/if}
			</div>
			<Button variant="danger" size="md" onclick={() => { showEmergencia = true; selected = null; }}>
				<span class="flex items-center gap-1.5">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
					Emergencia
				</span>
			</Button>
		</div>
	</div>

	<!-- Feedback is now handled via Toast notifications -->

	<!-- Main layout -->
	<div class="flex gap-4">
		<!-- Calendar -->
		<div class="flex-1 min-w-0 bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] overflow-hidden select-none">
			<div class="grid grid-cols-[2rem_1fr] sm:grid-cols-[2.5rem_1fr] relative h-[360px] sm:h-[480px] lg:h-[560px]">
				<!-- Hour axis -->
				<div class="relative border-r border-border/20">
					{#each horasEje as hora}
						<div class="absolute right-1 sm:right-1.5 text-xs text-ink-subtle tabular-nums -translate-y-1/2" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%">{String(hora).padStart(2, '0')}</div>
					{/each}
				</div>

				<!-- Day column -->
				<div class="relative">
					{#each horasEje as hora}
						<div class="absolute inset-x-0 border-t border-border/15" style="top: {((hora - HORA_MIN) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
						<div class="absolute inset-x-0 border-t border-border/8 border-dashed" style="top: {((hora - HORA_MIN + 0.5) / (HORA_MAX - HORA_MIN)) * 100}%"></div>
					{/each}

					<!-- Availability bg -->
					{#each data.disponibilidad as bloque}
						<div class="absolute inset-x-0 bg-viking-50/40 dark:bg-viking-950/20" style="top: {t2p(bloque.hora_inicio)}%; height: {t2p(bloque.hora_fin) - t2p(bloque.hora_inicio)}%;"></div>
					{/each}

					<!-- Now line -->
					{#if nowPercent > 0 && nowPercent < 100}
						<div class="absolute inset-x-0 z-20 flex items-center" style="top: {nowPercent}%;">
							<div class="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0"></div>
							<div class="flex-1 border-t border-red-500"></div>
						</div>
					{/if}

					<!-- Citas -->
					{#each data.citas as cita (cita.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 rounded border cursor-pointer transition-all {citaColor(cita.estado)} {selected?.id === cita.id ? 'ring-2 ring-viking-400 z-10' : 'hover:ring-1 hover:ring-viking-300'}"
							style="top: {t2p(cita.hora_inicio)}%; height: {t2p(cita.hora_fin) - t2p(cita.hora_inicio)}%; min-height: 40px;"
							onclick={() => { selected = cita; showEmergencia = false; }}
						>
							<div class="px-1 sm:px-2 py-0.5 sm:py-1 h-full overflow-hidden">
								<p class="text-xs font-semibold {citaTextColor(cita.estado)} truncate">
									{cita.paciente.nombre} {cita.paciente.apellido}
								</p>
								<p class="hidden sm:block text-xs {citaTextColor(cita.estado)} opacity-70 truncate">{cita.hora_inicio}–{cita.hora_fin} · {cita.motivo_consulta || 'Sin motivo'}</p>
							</div>
						</div>
					{/each}

					{#if data.citas.length === 0}
						<div class="absolute inset-0 flex items-center justify-center">
							<p class="text-xs sm:text-sm text-ink-muted">Sin citas hoy</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Desktop detail panel -->
		<div class="hidden lg:block w-72 xl:w-80 shrink-0">
			{#if selected}
				{@render detailContent(selected)}
			{:else}
				<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-1)] p-4">
					<p class="text-xs text-ink-muted text-center">Seleccione una cita para ver detalles</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile bottom sheet (when cita selected on <lg) -->
	{#if selected}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="lg:hidden fixed inset-0 z-40 flex items-end" onclick={() => selected = null}>
			<!-- Backdrop -->
			<div class="absolute inset-0 bg-black/30"></div>
			<!-- Sheet -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative w-full bg-surface-elevated rounded-t-2xl border-t border-border/60 shadow-[var(--shadow-3)] max-h-[80vh] overflow-y-auto animate-slide-up"
				onclick={(e) => e.stopPropagation()}
			>
				<!-- Drag handle -->
				<div class="flex justify-center pt-2 pb-1">
					<div class="w-8 h-1 rounded-full bg-border"></div>
				</div>
				{@render detailContent(selected)}
			</div>
		</div>
	{/if}

	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-ink-subtle px-1">
		<div class="flex items-center gap-1.5">
			<span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-viking-50/40 dark:bg-viking-950/20 border border-border/30"></span>
			Horario
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-viking-100 dark:bg-viking-900/30 border border-viking-300/50"></span>
			Pendiente
		</div>
		<div class="flex items-center gap-1.5">
			<span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300/50"></span>
			Atendida
		</div>
		<div class="flex items-center gap-1.5">
			<div class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></div>
			Ahora
		</div>
	</div>
</div>

<!-- Detail panel content (shared between desktop sidebar and mobile bottom sheet) -->
{#snippet detailContent(cita: CitaConPaciente)}
	<div class="overflow-hidden">
		<div class="px-4 py-3 border-b border-border/40 flex items-center justify-between">
			<h3 class="text-sm font-semibold text-ink">Detalle</h3>
			<AppointmentStatusBadge status={cita.estado} />
		</div>
		<div class="p-4 space-y-3">
			<div class="flex items-center gap-2">
				<svg class="w-4 h-4 text-ink-muted shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
				<div>
					<p class="text-sm font-medium text-ink">{cita.hora_inicio} — {cita.hora_fin}</p>
					<p class="text-xs text-ink-muted">{cita.duracion_min} min{cita.es_primera_vez ? ' · 1ª consulta' : ''}</p>
				</div>
			</div>
			<div class="flex items-start gap-2">
				<svg class="w-4 h-4 text-ink-muted shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
				<div>
					<p class="text-sm font-medium text-ink">{cita.paciente.nombre} {cita.paciente.apellido}</p>
					<p class="text-xs text-ink-muted">NHM: {cita.paciente.nhm ?? '—'} · {cita.paciente.cedula}</p>
				</div>
			</div>
			{#if cita.motivo_consulta}
				<div class="px-2.5 py-2 bg-canvas-subtle rounded-lg">
					<p class="text-xs text-ink-muted mb-0.5">Motivo</p>
					<p class="text-xs text-ink">{cita.motivo_consulta}</p>
				</div>
			{/if}
			{#if cita.paciente.datos_medicos?.tipo_sangre || cita.paciente.datos_medicos?.alergias?.length}
				<div class="flex flex-wrap gap-1.5">
					{#if cita.paciente.datos_medicos.tipo_sangre}
						<span class="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium">{cita.paciente.datos_medicos.tipo_sangre}</span>
					{/if}
					{#if cita.paciente.datos_medicos.alergias?.length}
						{#each cita.paciente.datos_medicos.alergias as al}
							<span class="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">⚠ {al}</span>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
		<div class="px-4 pb-4 space-y-2">
			<a href="/doctor/citas/{cita.id}" class="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium bg-viking-600 text-white hover:bg-viking-700 transition-colors">
				Evaluación médica
			</a>
			{#if cita.estado === 'pendiente' || cita.estado === 'confirmada'}
				<div class="flex gap-2">
					<form method="POST" action="?/marcarAtendida" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { selected = null; await invalidateAll(); toastSuccess('Cita atendida', `${cita.paciente.nombre} ${cita.paciente.apellido} fue marcada como atendida.`); } }; }} class="flex-1">
						<input type="hidden" name="citaId" value={cita.id} />
						<button type="submit" class="w-full px-3 py-2 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">Atendida</button>
					</form>
					<form method="POST" action="?/marcarNoAsistio" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type === 'success') { selected = null; await invalidateAll(); toastWarning('No asistió', `${cita.paciente.nombre} ${cita.paciente.apellido} fue marcada como inasistente.`); } }; }} class="flex-1">
						<input type="hidden" name="citaId" value={cita.id} />
						<button type="submit" class="w-full px-3 py-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">No asistió</button>
					</form>
				</div>
			{/if}
			<button onclick={() => selected = null} class="w-full text-center text-xs text-ink-subtle hover:text-ink-muted py-1">Cerrar</button>
		</div>
	</div>
{/snippet}

<!-- Dialog de emergencia -->
{#if showEmergencia}
	<Dialog open={true} onClose={resetEmergencia} size="sm">
		<DialogHeader>
			<h2 class="text-base font-semibold text-ink">Cita de Emergencia</h2>
		</DialogHeader>
		<DialogBody>
			<div class="space-y-4">
				{#if !emergPaciente}
					<!-- Paso 1: Buscar paciente -->
					<p class="text-sm text-ink-muted">Busque al paciente por NHM o cédula.</p>
					<Input label="NHM o Cédula" bind:value={emergQuery} placeholder="Ej: 1001 o V-12345678" />
					{#if emergError}
						<p class="text-sm text-red-600">{emergError}</p>
					{/if}
				{:else}
					<!-- Paso 2: Configurar cita -->
					<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3">
						<p class="text-sm font-medium text-ink">{emergPaciente.nombre} {emergPaciente.apellido}</p>
						<p class="text-sm text-ink-muted">NHM {emergPaciente.nhm}</p>
						<button type="button" class="text-sm text-viking-600 mt-1 hover:underline" onclick={() => { emergPaciente = null; }}>Cambiar paciente</button>
					</div>

					<Input label="Motivo de consulta" bind:value={emergMotivo} placeholder="Motivo..." />

					<Select
						label="Hora de inicio"
						options={emergHoraOpciones}
						value={emergHoraInicio}
						onchange={(v) => { if (typeof v === 'string') emergHoraInicio = v; }}
					/>

					<fieldset>
						<legend class="block text-sm font-medium text-ink mb-2">Duración de la consulta</legend>
						<div class="grid grid-cols-4 gap-2">
							{#each ['15', '30', '45', '60'] as d}
								<button
									type="button"
									class="py-3 text-sm font-medium rounded-lg border transition-colors
										{emergDuracion === d ? 'border-viking-400 bg-viking-50 dark:bg-viking-900/20 text-viking-700 dark:text-viking-300' : 'border-border/60 text-ink-muted hover:bg-canvas-subtle'}"
									onclick={() => { emergDuracion = d; }}
								>{d} min</button>
							{/each}
						</div>
					</fieldset>
				{/if}
			</div>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={resetEmergencia}>Cancelar</Button>
			{#if !emergPaciente}
				<Button variant="primary" size="md" onclick={buscarPacienteEmergencia} isLoading={emergSearching}>Buscar paciente</Button>
			{:else}
				<form
					method="POST"
					action="?/citaEmergencia"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update();
							if (result.type === 'success') {
								const nombre = emergPaciente?.nombre ?? '';
								resetEmergencia();
								await invalidateAll();
								toastSuccess('Cita de emergencia creada', `Se agendó la cita para ${nombre}.`);
							} else {
								toastError('Error', 'No se pudo crear la cita de emergencia.');
							}
						};
					}}
				>
					<input type="hidden" name="pacienteId" value={emergPaciente.id} />
					<input type="hidden" name="especialidadId" value={data.doctorEspecialidadId} />
					<input type="hidden" name="motivo" value={emergMotivo} />
					<input type="hidden" name="hora_inicio" value={emergHoraInicio} />
					<input type="hidden" name="duracion" value={emergDuracion} />
					<Button type="submit" variant="danger" size="md">Crear cita de emergencia</Button>
				</form>
			{/if}
		</DialogFooter>
	</Dialog>
{/if}
