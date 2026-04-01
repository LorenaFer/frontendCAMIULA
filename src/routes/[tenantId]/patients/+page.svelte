<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import StatusBadge from '$shared/components/inventory/StatusBadge.svelte';

	let { data }: { data: PageData } = $props();
	const tenantId = $derived($page.params.tenantId);

	let searchQuery = $state(data.filters.query ?? '');
	let activeTab = $state<'timeline' | 'citas' | 'despachos'>('timeline');
	let expandedEntryId = $state<string | null>(null);

	function doSearch() {
		if (!searchQuery.trim()) return;
		goto(`?query=${encodeURIComponent(searchQuery.trim())}`, { replaceState: true });
	}

	function formatFecha(fecha: string) {
		try {
			return new Date(fecha + 'T12:00:00').toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
		} catch { return fecha; }
	}

	const relationLabels: Record<string, string> = {
		P: 'Profesor', E: 'Empleado', O: 'Obrero', B: 'Estudiante',
		F: 'Familiar', C: 'Fam. Estudiante', R: 'Fam. Profesor',
		S: 'Fam. Empleado', T: 'Fam. Obrero', X: 'Caso Especial',
		empleado: 'Empleado', estudiante: 'Estudiante', profesor: 'Profesor', tercero: 'Tercero'
	};
</script>

<svelte:head><title>Pacientes — Vista 360°</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold text-ink">Pacientes</h1>
			<p class="text-sm text-ink-muted mt-0.5">Vista 360° del paciente</p>
		</div>
	</div>

	<!-- Búsqueda (auto-detect NHM/Cédula) -->
	<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
		<form onsubmit={(e) => { e.preventDefault(); doSearch(); }} class="flex gap-3">
			<div class="flex-1">
				<Input
					label="Buscar paciente"
					placeholder="Cédula o NHM del paciente..."
					bind:value={searchQuery}
					inputSize="lg"
				/>
			</div>
			<div class="flex items-end">
				<Button type="submit" variant="primary" size="lg">Buscar</Button>
			</div>
		</form>
		{#if data.validationMessage}
			<p class="text-sm text-red-600 mt-2">{data.validationMessage}</p>
		{/if}
	</div>

	{#if !data.patient && data.searched}
		<Card padding="lg">
			<EmptyState
				title="Paciente no encontrado"
				description="Verifique el número de cédula o NHM e intente de nuevo."
			/>
		</Card>
	{:else if !data.patient}
		<Card padding="lg">
			<EmptyState
				title="Busque un paciente"
				description="Ingrese la cédula o el NHM para ver la vista 360° del paciente."
			/>
		</Card>
	{/if}

	{#if data.patient}
		{@const p = data.patient}
		{@const s = data.stats}

		<!-- Patient Header Card -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl p-5">
			<div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
				<div class="flex items-start gap-4">
					<!-- Avatar -->
					<div class="w-14 h-14 rounded-full bg-viking-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
						{p.nombre[0]}{p.apellido[0]}
					</div>
					<div>
						<h2 class="text-xl font-bold text-ink">{p.nombre} {p.apellido}</h2>
						<p class="text-sm text-ink-muted mt-0.5">
							{relationLabels[p.relacion_univ] ?? p.relacion_univ}
							{#if p.edad} — {p.edad} años{/if}
							{#if p.sexo} — {p.sexo === 'M' ? 'Masculino' : 'Femenino'}{/if}
						</p>
						<div class="flex flex-wrap gap-2 mt-2">
							<Badge variant="primary" style="outline" size="sm">NHM: {p.nhm}</Badge>
							<Badge variant="default" style="outline" size="sm">C.I: {p.cedula}</Badge>
							{#if p.datos_medicos?.tipo_sangre}
								<Badge variant="danger" style="soft" size="sm">{p.datos_medicos.tipo_sangre}</Badge>
							{/if}
							{#if p.es_nuevo}
								<Badge variant="warning" style="soft" size="sm">Primera vez</Badge>
							{/if}
						</div>
					</div>
				</div>

				<!-- Quick info -->
				<div class="grid grid-cols-2 gap-2 text-sm lg:w-64">
					{#if p.telefono}
						<div>
							<p class="text-ink-muted text-xs">Teléfono</p>
							<p class="text-ink font-medium">{p.telefono}</p>
						</div>
					{/if}
					{#if p.estado_civil}
						<div>
							<p class="text-ink-muted text-xs">Estado civil</p>
							<p class="text-ink font-medium capitalize">{p.estado_civil.replace('_', ' ')}</p>
						</div>
					{/if}
					{#if p.profesion}
						<div>
							<p class="text-ink-muted text-xs">Profesión</p>
							<p class="text-ink font-medium">{p.profesion}</p>
						</div>
					{/if}
					<div>
						<p class="text-ink-muted text-xs">Registro</p>
						<p class="text-ink font-medium">{formatFecha(p.created_at)}</p>
					</div>
				</div>
			</div>

			<!-- Alergias warning -->
			{#if data.medicalSnapshot && data.medicalSnapshot.alergias.length > 0}
				<div class="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
					<svg class="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
					<span class="text-sm text-red-700 dark:text-red-300 font-medium">Alergias: {data.medicalSnapshot.alergias.join(', ')}</span>
				</div>
			{/if}
		</div>

		<!-- KPI Stats -->
		{#if s}
			<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Total citas</p>
					<p class="text-2xl font-bold text-ink tabular-nums">{s.totalCitas}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Atendidas</p>
					<p class="text-2xl font-bold text-sage-600 tabular-nums">{s.citasAtendidas}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Pendientes</p>
					<p class="text-2xl font-bold text-amber-600 tabular-nums">{s.citasPendientes}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">No asistió</p>
					<p class="text-2xl font-bold text-red-600 tabular-nums">{s.noShows}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Despachos</p>
					<p class="text-2xl font-bold text-viking-600 tabular-nums">{s.totalDespachos}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Canceladas</p>
					<p class="text-2xl font-bold text-ink-subtle tabular-nums">{s.citasCanceladas}</p>
				</div>
			</div>
		{/if}

		<!-- Tabs -->
		<div class="flex gap-1 p-1 bg-canvas-subtle rounded-xl border border-border/40">
			{#each [['timeline', 'Historial'], ['citas', `Citas (${data.patientCitas.length})`], ['despachos', `Despachos (${data.patientDispatches.length})`]] as [key, label]}
				<button
					type="button"
					class="flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors
						{activeTab === key ? 'bg-surface-elevated text-ink shadow-sm border border-border/60' : 'text-ink-muted hover:text-ink'}"
					onclick={() => { activeTab = key as typeof activeTab; }}
				>{label}</button>
			{/each}
		</div>

		<!-- Tab: Timeline -->
		{#if activeTab === 'timeline'}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60">
					<h3 class="text-sm font-semibold text-ink">Línea de tiempo médica</h3>
				</div>
				{#if data.historyTimeline.length > 0}
					<div class="p-4">
						<div class="relative pl-4 border-l-2 border-border/60 space-y-4">
							{#each data.historyTimeline as entry, i (entry.id)}
								{@const dotColor = entry.categoria === 'consulta' ? 'bg-viking-500' : entry.categoria === 'despacho' ? 'bg-sage-500' : 'bg-border'}
								{@const isExpanded = expandedEntryId === entry.id}
								{@const hasDetail = !!entry.formulario}
								<div class="relative">
									<div class="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-surface-elevated {dotColor}"></div>
									<button
										type="button"
										class="w-full text-left bg-canvas-subtle/50 rounded-lg border border-border/30 p-3 transition-colors {hasDetail ? 'hover:bg-canvas-subtle cursor-pointer' : ''}"
										onclick={() => { if (hasDetail) expandedEntryId = isExpanded ? null : entry.id; }}
										disabled={!hasDetail}
									>
										<div class="flex items-start justify-between gap-2">
											<div>
												<p class="text-sm font-semibold text-ink">{entry.titulo}</p>
												<p class="text-xs text-ink-muted">{entry.detalle}</p>
											</div>
											<div class="flex items-center gap-2 shrink-0">
												<Badge variant={entry.categoria === 'consulta' ? 'info' : entry.categoria === 'despacho' ? 'success' : 'default'} style="soft" size="sm">
													{entry.categoria === 'consulta' ? 'Consulta' : entry.categoria === 'despacho' ? 'Despacho' : 'Admin'}
												</Badge>
												<span class="text-xs text-ink-muted">{formatFecha(entry.fecha)}</span>
												{#if hasDetail}
													<svg class="w-4 h-4 text-ink-subtle transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
														<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</div>
										</div>

										<!-- Resumen (siempre visible si tiene diagnóstico) -->
										{#if entry.formulario?.diagnostico && !isExpanded}
											<p class="mt-1.5 text-xs text-ink-muted">
												{#if entry.formulario.diagnosticoCie10}<span class="font-mono text-viking-600 dark:text-viking-400">{entry.formulario.diagnosticoCie10}</span> — {/if}{entry.formulario.diagnostico}
											</p>
										{/if}
									</button>

									<!-- Detalle expandido -->
									{#if isExpanded && entry.formulario}
										{@const f = entry.formulario}
										<div class="mt-1 bg-surface-elevated border border-border/60 rounded-lg p-4 space-y-4 animate-fade-in-up">
											<!-- Motivo + Anamnesis -->
											{#if f.motivoConsulta || f.anamnesis}
												<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
													{#if f.motivoConsulta}
														<div>
															<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Motivo de consulta</p>
															<p class="text-sm text-ink">{f.motivoConsulta}</p>
														</div>
													{/if}
													{#if f.anamnesis}
														<div>
															<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Anamnesis</p>
															<p class="text-sm text-ink">{f.anamnesis}</p>
														</div>
													{/if}
												</div>
											{/if}

											<!-- Examen físico -->
											{#if f.examenFisico && (f.examenFisico.ta || f.examenFisico.fc || f.examenFisico.peso)}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Signos vitales</p>
													<div class="flex flex-wrap gap-3">
														{#each [['T.A.', f.examenFisico.ta, 'mmHg'], ['F.C.', f.examenFisico.fc, 'lpm'], ['F.R.', f.examenFisico.fr, 'rpm'], ['Temp', f.examenFisico.temp, '°C'], ['Peso', f.examenFisico.peso, 'kg'], ['Talla', f.examenFisico.talla, 'm']] as [label, val, unit]}
															{#if val}
																<div class="bg-canvas-subtle rounded-lg px-3 py-1.5 border border-border/40">
																	<p class="text-xs text-ink-muted">{label}</p>
																	<p class="text-sm font-mono font-medium text-ink">{val} <span class="text-xs text-ink-subtle">{unit}</span></p>
																</div>
															{/if}
														{/each}
													</div>
												</div>
											{/if}

											<!-- Diagnóstico -->
											{#if f.diagnostico}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Diagnóstico</p>
													<p class="text-sm text-ink">
														{#if f.diagnosticoCie10}<span class="font-mono text-viking-600 dark:text-viking-400 font-medium">{f.diagnosticoCie10}</span> — {/if}
														{f.diagnostico}
													</p>
												</div>
											{/if}

											<!-- Tratamiento + Indicaciones -->
											<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
												{#if f.tratamiento}
													<div>
														<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Tratamiento</p>
														<p class="text-sm text-ink">{f.tratamiento}</p>
													</div>
												{/if}
												{#if f.indicaciones}
													<div>
														<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Indicaciones</p>
														<p class="text-sm text-ink">{f.indicaciones}</p>
													</div>
												{/if}
											</div>

											<!-- Exámenes solicitados -->
											{#if f.examenesSolicitados && f.examenesSolicitados.length > 0}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Exámenes solicitados</p>
													<div class="flex flex-wrap gap-1.5">
														{#each f.examenesSolicitados as exam}
															<span class="text-xs px-2.5 py-1 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg text-viking-700 dark:text-viking-300">
																{exam.nombre}
															</span>
														{/each}
													</div>
												</div>
											{/if}

											<!-- Receta -->
											{#if f.receta && f.receta.length > 0}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Receta médica</p>
													<div class="space-y-1.5">
														{#each f.receta as med}
															<div class="flex items-center gap-2 text-sm">
																<span class="w-1.5 h-1.5 rounded-full bg-sage-500 shrink-0"></span>
																<span class="font-medium text-ink">{med.medicamento}</span>
																{#if med.dosis}<span class="text-ink-muted">{med.dosis}</span>{/if}
																{#if med.frecuencia}<span class="text-ink-muted">· {med.frecuencia}</span>{/if}
																{#if med.duracion}<span class="text-ink-muted">· {med.duracion}</span>{/if}
															</div>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="p-6">
						<EmptyState title="Sin registros" description="Este paciente aún no tiene eventos en su historial." />
					</div>
				{/if}
			</Card>
		{/if}

		<!-- Tab: Citas -->
		{#if activeTab === 'citas'}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60">
					<h3 class="text-sm font-semibold text-ink">Historial de citas</h3>
				</div>
				{#if data.patientCitas.length > 0}
					<div class="divide-y divide-border/40">
						{#each data.patientCitas as cita (cita.id)}
							<div class="px-4 py-3 flex items-center justify-between gap-3">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-ink">{formatFecha(cita.fecha)} · {cita.hora_inicio}–{cita.hora_fin}</p>
									<p class="text-xs text-ink-muted truncate">
										{cita.doctor?.especialidad?.nombre ?? '—'} — Dr. {cita.doctor?.nombre} {cita.doctor?.apellido}
									</p>
									{#if cita.motivo_consulta}
										<p class="text-xs text-ink-subtle mt-0.5 truncate">{cita.motivo_consulta}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2 shrink-0">
									{#if cita.es_primera_vez}
										<Badge variant="primary" style="soft" size="sm">1ª vez</Badge>
									{/if}
									<AppointmentStatusBadge status={cita.estado} />
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-6">
						<EmptyState title="Sin citas" description="Este paciente no tiene citas registradas." />
					</div>
				{/if}
			</Card>
		{/if}

		<!-- Tab: Despachos -->
		{#if activeTab === 'despachos'}
			<Card padding="none">
				<div class="px-4 py-3 border-b border-border/60">
					<h3 class="text-sm font-semibold text-ink">Historial de despachos de farmacia</h3>
				</div>
				{#if data.patientDispatches.length > 0}
					<div class="divide-y divide-border/40">
						{#each data.patientDispatches as dispatch (dispatch.id)}
							<div class="px-4 py-3">
								<div class="flex items-start justify-between gap-3 mb-2">
									<div>
										<p class="text-sm font-medium text-ink">Receta {dispatch.prescription_number}</p>
										<p class="text-xs text-ink-muted">{formatFecha(dispatch.dispatch_date)} — {dispatch.pharmacist_name ?? 'Farmacia'}</p>
									</div>
									<StatusBadge status={dispatch.dispatch_status} />
								</div>
								{#if dispatch.items.length > 0}
									<div class="flex flex-wrap gap-1.5">
										{#each dispatch.items as item}
											<span class="text-xs px-2 py-0.5 bg-canvas-subtle border border-border/40 rounded text-ink">
												{item.medication.generic_name} × {item.quantity_dispatched}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="p-6">
						<EmptyState title="Sin despachos" description="No hay medicamentos despachados para este paciente." />
					</div>
				{/if}
			</Card>
		{/if}

		<!-- Contacto de emergencia -->
		{#if p.contacto_emergencia?.nombre}
			<div class="bg-surface-elevated border border-border/60 rounded-xl p-4">
				<h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Contacto de emergencia</h3>
				<div class="flex flex-wrap gap-4 text-sm">
					<div><span class="text-ink-muted">Nombre:</span> <span class="text-ink font-medium">{p.contacto_emergencia.nombre}</span></div>
					{#if p.contacto_emergencia.parentesco}
						<div><span class="text-ink-muted">Parentesco:</span> <span class="text-ink font-medium capitalize">{p.contacto_emergencia.parentesco}</span></div>
					{/if}
					{#if p.contacto_emergencia.telefono}
						<div><span class="text-ink-muted">Teléfono:</span> <a href="tel:{p.contacto_emergencia.telefono}" class="text-viking-600 font-medium hover:underline">{p.contacto_emergencia.telefono}</a></div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
