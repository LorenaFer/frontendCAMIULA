<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import Breadcrumbs from '$shared/components/layout/Breadcrumbs.svelte';
	import AppointmentStatusBadge from '$domain/appointments/components/widgets/AppointmentStatusBadge.svelte';
	import StatusBadge from '$domain/inventory/components/widgets/StatusBadge.svelte';
	import { TabGroup } from '$shared/components/tabs';

	let { data }: { data: PageData } = $props();
	const p = $derived(data.patient);
	const s = $derived(data.stats);

	let activeTab = $state<'timeline' | 'citas' | 'despachos'>('timeline');
	let expandedEntryId = $state<string | null>(null);

	function formatFecha(fecha: string) {
		try {
			// Si es solo fecha (YYYY-MM-DD), agregar hora para evitar desfase UTC
			const d = fecha.includes('T') ? new Date(fecha) : new Date(fecha + 'T12:00:00');
			if (isNaN(d.getTime())) return fecha;
			return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
		} catch { return fecha; }
	}

	const relationLabels: Record<string, string> = {
		P: 'Profesor', E: 'Empleado', O: 'Obrero', B: 'Estudiante',
		F: 'Familiar', C: 'Fam. Estudiante', R: 'Fam. Profesor',
		S: 'Fam. Empleado', T: 'Fam. Obrero', X: 'Caso Especial',
		empleado: 'Empleado', estudiante: 'Estudiante', profesor: 'Profesor', tercero: 'Tercero'
	};
</script>

<svelte:head><title>{p.nombre} {p.apellido} — Vista 360°</title></svelte:head>

<div class="space-y-5 animate-fade-in-up">
	<Breadcrumbs items={[
		{ label: 'Pacientes', href: '/patients' },
		{ label: `${p.nombre} ${p.apellido}` }
	]} />

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
					<p class="data-value text-2xl font-bold text-ink">{s.totalCitas}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Atendidas</p>
					<p class="data-value text-2xl font-bold text-emerald-600">{s.citasAtendidas}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Pendientes</p>
					<p class="data-value text-2xl font-bold text-amber-600">{s.citasPendientes}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">No asistió</p>
					<p class="data-value text-2xl font-bold text-red-600">{s.noShows}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Despachos</p>
					<p class="data-value text-2xl font-bold text-viking-600">{s.totalDespachos}</p>
				</div>
				<div class="bg-surface-elevated border border-border/60 rounded-xl px-4 py-3">
					<p class="text-xs text-ink-muted">Canceladas</p>
					<p class="data-value text-2xl font-bold text-ink-subtle">{s.citasCanceladas}</p>
				</div>
			</div>
		{/if}

		<!-- Tabs -->
		<TabGroup
			tabs={[
				{ id: 'timeline', label: 'Historial' },
				{ id: 'citas', label: `Citas (${data.patientCitas.length})` },
				{ id: 'despachos', label: `Despachos (${data.patientDispatches.length})` }
			]}
			bind:active={activeTab}
			variant="underline"
		/>

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
								{@const hasDetail = !!(entry.formSections?.length || entry.examenesSolicitados?.length || entry.receta?.length || entry.observaciones)}
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

										<!-- Resumen colapsado: muestra primer campo de diagnóstico si existe -->
										{#if !isExpanded && entry.formSections?.length}
											{@const diagSection = entry.formSections.find((s) => s.title.toLowerCase().includes('diagnóstico') || s.title.toLowerCase().includes('diagnostico'))}
											{#if diagSection}
												<p class="mt-1.5 text-xs text-ink-muted truncate">
													{diagSection.fields.map((f) => f.value).join(' — ')}
												</p>
											{/if}
										{/if}
									</button>

									<!-- Detalle expandido -->
									{#if isExpanded && (entry.formSections?.length || entry.examenesSolicitados?.length || entry.receta?.length || entry.observaciones)}
										<div class="mt-1 bg-surface-elevated border border-border/60 rounded-lg p-4 space-y-4 animate-fade-in-up">
											<!-- Especialidad header -->
											{#if entry.especialidad}
												<div class="flex items-center gap-2 pb-2 border-b border-border/40">
													<Badge variant="info" style="outline" size="sm">{entry.especialidad}</Badge>
													<span class="text-xs text-ink-muted">Formulario de evaluación</span>
												</div>
											{/if}

											<!-- Secciones dinámicas del schema de especialidad -->
											{#if entry.formSections && entry.formSections.length > 0}
												{#each entry.formSections as section}
													<div>
														<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">{section.title}</p>
														<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
															{#each section.fields as field}
																<div>
																	<p class="text-xs text-ink-subtle">{field.label}</p>
																	<p class="text-sm text-ink">{field.value}</p>
																</div>
															{/each}
														</div>
													</div>
												{/each}
											{/if}

											<!-- Observaciones -->
											{#if entry.observaciones}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Observaciones</p>
													<p class="text-sm text-ink">{entry.observaciones}</p>
												</div>
											{/if}

											<!-- Exámenes solicitados -->
											{#if entry.examenesSolicitados && entry.examenesSolicitados.length > 0}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Exámenes solicitados</p>
													<div class="flex flex-wrap gap-1.5">
														{#each entry.examenesSolicitados as exam}
															<span class="text-xs px-2.5 py-1 bg-viking-50 dark:bg-viking-900/20 border border-viking-200 dark:border-viking-800 rounded-lg text-viking-700 dark:text-viking-300">
																{exam.nombre}
																{#if exam.indicaciones}
																	<span class="text-viking-500 ml-1">({exam.indicaciones})</span>
																{/if}
															</span>
														{/each}
													</div>
												</div>
											{/if}

											<!-- Receta -->
											{#if entry.receta && entry.receta.length > 0}
												<div>
													<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Receta médica</p>
													<div class="space-y-1.5">
														{#each entry.receta as med}
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
</div>
