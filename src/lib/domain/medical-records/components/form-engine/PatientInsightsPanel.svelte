<script lang="ts">
	import type { Paciente } from '$domain/patients/types.js';
	import type { CitaConPaciente } from '$domain/appointments/types.js';
	import type { HistorialPrevioEntry } from '$domain/medical-records/types.js';
	import { computeAlerts, formatAge, formatRelacion } from './insight-helpers.js';
	import type { PatientAlert } from './insight-helpers.js';

	interface Props {
		paciente: Paciente;
		cita: CitaConPaciente;
		previousHistories: HistorialPrevioEntry[];
		class?: string;
	}

	let { paciente, cita, previousHistories, class: className = '' }: Props = $props();

	let alerts = $derived(
		computeAlerts(paciente, previousHistories, cita.doctor?.especialidad?.nombre)
	);

	let showDemographics = $state(false);
	let showHistory = $state(true); // Abierto por defecto — el doctor necesita ver contexto

	const alertColorMap: Record<PatientAlert['type'], { bg: string; border: string; text: string }> =
		{
			danger: {
				bg: 'bg-red-50 dark:bg-red-950/30',
				border: 'border-red-200 dark:border-red-800',
				text: 'text-red-700 dark:text-red-300'
			},
			warning: {
				bg: 'bg-amber-50 dark:bg-amber-950/30',
				border: 'border-amber-200 dark:border-amber-800',
				text: 'text-amber-700 dark:text-amber-300'
			},
			info: {
				bg: 'bg-viking-50 dark:bg-viking-950/30',
				border: 'border-viking-200 dark:border-viking-800',
				text: 'text-viking-700 dark:text-viking-300'
			}
		};
</script>

<aside class="space-y-3 {className}">
	<!-- Alertas Críticas -->
	{#if alerts.length > 0 || paciente.datos_medicos?.tipo_sangre}
		<div class="bg-surface rounded-xl border border-border p-4 space-y-2.5">
			<h4 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
				Alertas del Paciente
			</h4>

			{#if paciente.datos_medicos?.tipo_sangre}
				<div
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
					bg-iris-50 dark:bg-iris-950/30 text-iris-700 dark:text-iris-300 border border-iris-200 dark:border-iris-800"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 2.25c-1.5 3-6 6.75-6 10.5a6 6 0 0012 0c0-3.75-4.5-7.5-6-10.5z"
						/>
					</svg>
					{paciente.datos_medicos.tipo_sangre}
				</div>
			{/if}

			{#each alerts as alert (alert.label)}
				{@const colors = alertColorMap[alert.type]}
				<div class="flex items-start gap-2 px-3 py-2 rounded-lg border {colors.bg} {colors.border}">
					<span class="text-xs font-medium {colors.text} shrink-0">{alert.label}</span>
					{#if alert.detail}
						<span class="text-xs {colors.text} opacity-80">{alert.detail}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Contexto de la Cita -->
	<div class="bg-surface rounded-xl border border-border p-4">
		<h4 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
			Cita Actual
		</h4>
		<div class="space-y-1.5 text-xs">
			<div class="flex justify-between">
				<span class="text-ink-muted">Fecha</span>
				<span class="text-ink font-medium">{cita.fecha}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-ink-muted">Hora</span>
				<span class="text-ink font-medium">{cita.hora_inicio} — {cita.hora_fin}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-ink-muted">Duración</span>
				<span class="text-ink font-medium">{cita.duracion_min} min</span>
			</div>
			<div class="flex justify-between">
				<span class="text-ink-muted">Especialidad</span>
				<span class="text-ink font-medium">{cita.doctor?.especialidad?.nombre ?? '—'}</span>
			</div>
			{#if cita.es_primera_vez}
				<div
					class="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
					bg-viking-50 dark:bg-viking-950/30 text-viking-700 dark:text-viking-300"
				>
					★ Primera consulta
				</div>
			{/if}
			{#if cita.motivo_consulta}
				<div class="mt-2 pt-2 border-t border-border/50">
					<span class="text-ink-muted block mb-0.5">Motivo (al agendar)</span>
					<p class="text-ink text-xs leading-relaxed">{cita.motivo_consulta}</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Datos Demográficos (colapsable) -->
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<button
			type="button"
			class="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas-subtle/50 transition-colors"
			onclick={() => (showDemographics = !showDemographics)}
		>
			<h4 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
				Datos del Paciente
			</h4>
			<svg
				class="w-3.5 h-3.5 text-ink-muted transition-transform duration-200 {showDemographics
					? 'rotate-180'
					: ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</button>

		{#if showDemographics}
			<div class="px-4 pb-4 space-y-1.5 text-xs border-t border-border/50 pt-3">
				<div class="flex justify-between">
					<span class="text-ink-muted">NHM</span>
					<span class="text-ink font-medium font-mono">{paciente.nhm}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-ink-muted">Cédula</span>
					<span class="text-ink font-medium">{paciente.cedula}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-ink-muted">Edad</span>
					<span class="text-ink font-medium">{formatAge(paciente.edad)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-ink-muted">Sexo</span>
					<span class="text-ink font-medium">{paciente.sexo === 'M' ? 'Masculino' : 'Femenino'}</span>
				</div>
				{#if paciente.estado_civil}
					<div class="flex justify-between">
						<span class="text-ink-muted">Estado civil</span>
						<span class="text-ink font-medium capitalize">{paciente.estado_civil.replace('_', ' ')}</span>
					</div>
				{/if}
				<div class="flex justify-between">
					<span class="text-ink-muted">Relación</span>
					<span class="text-ink font-medium">{formatRelacion(paciente.relacion_univ)}</span>
				</div>
				{#if paciente.profesion}
					<div class="flex justify-between">
						<span class="text-ink-muted">Profesión</span>
						<span class="text-ink font-medium">{paciente.profesion}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Historial Previo (colapsable) -->
	{#if previousHistories.length > 0}
		<div class="bg-surface rounded-xl border border-border overflow-hidden">
			<button
				type="button"
				class="w-full flex items-center justify-between px-4 py-3 hover:bg-canvas-subtle/50 transition-colors"
				onclick={() => (showHistory = !showHistory)}
			>
				<h4 class="text-xs font-semibold text-ink-muted uppercase tracking-wider">
					Historial Previo
					<span
						class="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px]
						bg-canvas-subtle text-ink-muted font-bold"
					>
						{previousHistories.length}
					</span>
				</h4>
				<svg
					class="w-3.5 h-3.5 text-ink-muted transition-transform duration-200 {showHistory
						? 'rotate-180'
						: ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m19.5 8.25-7.5 7.5-7.5-7.5"
					/>
				</svg>
			</button>

			{#if showHistory}
				<div class="px-4 pb-4 border-t border-border/50 pt-3">
					<div class="relative pl-4 border-l-2 border-border/60 space-y-3">
						{#each previousHistories as entry, i (entry.id)}
							<div class="relative">
								<div class="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-surface-elevated
									{i === 0 ? 'bg-viking-500' : 'bg-border'}"></div>
								<div class="bg-canvas-subtle/50 rounded-lg border border-border/30 p-3">
									<div class="flex items-center justify-between mb-1">
										<span class="text-xs font-semibold text-ink">{entry.fecha}</span>
										<span class="text-xs text-ink-muted bg-canvas-subtle px-1.5 py-0.5 rounded">{entry.especialidad}</span>
									</div>
									<p class="text-xs text-ink-muted">Dr. {entry.doctor_nombre}</p>
									{#if entry.diagnostico_descripcion}
										<div class="mt-1.5 pt-1.5 border-t border-border/30">
											<p class="text-xs text-ink">
												{#if entry.diagnostico_cie10}
													<span class="font-mono text-viking-600 dark:text-viking-400 font-medium">{entry.diagnostico_cie10}</span> —
												{/if}
												{entry.diagnostico_descripcion}
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Contacto de Emergencia -->
	{#if paciente.contacto_emergencia?.nombre}
		<div class="bg-surface rounded-xl border border-border p-4">
			<h4 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
				Contacto de Emergencia
			</h4>
			<div class="space-y-1.5 text-xs">
				<div class="flex justify-between">
					<span class="text-ink-muted">Nombre</span>
					<span class="text-ink font-medium">{paciente.contacto_emergencia.nombre}</span>
				</div>
				{#if paciente.contacto_emergencia.parentesco}
					<div class="flex justify-between">
						<span class="text-ink-muted">Parentesco</span>
						<span class="text-ink font-medium capitalize"
							>{paciente.contacto_emergencia.parentesco}</span
						>
					</div>
				{/if}
				{#if paciente.contacto_emergencia.telefono}
					<div class="flex justify-between">
						<span class="text-ink-muted">Teléfono</span>
						<a
							href="tel:{paciente.contacto_emergencia.telefono}"
							class="text-viking-600 dark:text-viking-400 font-medium hover:underline"
						>
							{paciente.contacto_emergencia.telefono}
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</aside>
