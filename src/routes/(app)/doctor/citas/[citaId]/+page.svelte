<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance, deserialize } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import AppointmentStatusBadge from '$domain/appointments/components/AppointmentStatusBadge.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';
	import FormEngine from '$domain/medical-records/components/form-engine/FormEngine.svelte';
	import ObservacionesSection from '$domain/medical-records/components/form-engine/ObservacionesSection.svelte';
	import PrescriptionSection from '$domain/medical-records/components/form-engine/PrescriptionSection.svelte';
	import ExamenesSection from '$domain/medical-records/components/form-engine/ExamenesSection.svelte';
	import type { ExamenSolicitado } from '$domain/medical-records/components/form-engine/ExamenesSection.svelte';
	import PatientInsightsPanel from '$domain/medical-records/components/form-engine/PatientInsightsPanel.svelte';
	import type { PrescriptionItem } from '$domain/medical-records/prescription.js';
	import { goto } from '$app/navigation';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isReadonly = $derived(data.cita.estado === 'cancelada');

	const schemaId = data.formSchema.id;
	const schemaVersion = data.formSchema.version;
	let saved = $state(false);
	let showLeaveDialog = $state(false);
	let pendingNavigation = $state<{ cancel: () => void; url?: URL; to?: { url: URL } } | null>(null);
	let formEngineRef: { store: import('$domain/medical-records/components/form-engine/form-store.svelte.js').FormStore } | undefined;

	// Estado para secciones universales (independientes del schema)
	const evalData = (data.historia?.evaluacion ?? {}) as Record<string, unknown>;
	let observaciones = $state<string>((evalData.observaciones as string) ?? '');
	let examenesSolicitados = $state<ExamenSolicitado[]>(
		(evalData.examenes_solicitados as ExamenSolicitado[]) ?? []
	);
	let recetaItems = $state<PrescriptionItem[]>(
		((evalData.receta as Record<string, unknown>)?.medicamentos as PrescriptionItem[]) ?? []
	);

	// Mergea datos del FormEngine + secciones universales
	function mergeAllData(formData: Record<string, unknown>): Record<string, unknown> {
		return {
			...formData,
			observaciones,
			examenes_solicitados: examenesSolicitados,
			receta: { medicamentos: recetaItems }
		};
	}

	// Guardar evaluación via fetch directo
	async function handleSave(formData: Record<string, unknown>) {
		const merged = mergeAllData(formData);
		const body = new FormData();
		body.set('evaluacion', JSON.stringify(merged));
		body.set('schema_id', schemaId);
		body.set('schema_version', schemaVersion);

		const res = await fetch('?/guardarEvaluacion', { method: 'POST', body });
		let result;
		try {
			result = deserialize(await res.text());
		} catch {
			toastError('Error al guardar', 'Respuesta inesperada del servidor.');
			return;
		}

		if (result.type === 'success') {
			saved = true;
			toastSuccess('Evaluación guardada', `Evaluación de ${data.cita.paciente.nombre} ${data.cita.paciente.apellido} guardada correctamente.`);
		} else {
			const errMsg = result.type === 'failure' ? ((result.data as Record<string, string>)?.error ?? 'Error al guardar') : 'No se pudo guardar la evaluación.';
			toastError('Error al guardar', errMsg);
		}
	}

	// Emitir receta formal inline (sin navegar a /prescription)
	let recipeEmitted = $state(!!data.existingPrescription);
	let emittingRecipe = $state(false);

	async function handleEmitRecipe(items: PrescriptionItem[]) {
		if (items.length === 0) return;
		emittingRecipe = true;
		try {
			const body = new FormData();
			body.set('items', JSON.stringify(items.map((i) => ({
				medicamento: i.medicamento, presentacion: i.presentacion,
				dosis: i.dosis, via: i.via, frecuencia: i.frecuencia,
				duracion: i.duracion, cantidad: i.cantidad, indicaciones: i.indicaciones
			}))));
			const res = await fetch(`?/emitirReceta`, { method: 'POST', body });
			const json = await res.json();
			if (json.type === 'success') {
				recipeEmitted = true;
				toastSuccess('Receta emitida', 'La receta médica fue generada correctamente.');
			}
		} catch {
			toastError('Error', 'No se pudo emitir la receta.');
		} finally {
			emittingRecipe = false;
		}
	}

	// Finalizar cita: guardar evaluación + marcar como atendida
	let finalizing = $state(false);

	async function handleFinalize() {
		if (!formEngineRef?.store) return;
		finalizing = true;
		try {
			const formData = formEngineRef.store.getSubmitData();
			const merged = mergeAllData(formData);

			const body = new FormData();
			body.set('evaluacion', JSON.stringify(merged));
			body.set('schema_id', schemaId);
			body.set('schema_version', schemaVersion);

			const res = await fetch('?/finalizarCita', { method: 'POST', body });
			const result = deserialize(await res.text());

			if (result.type === 'success') {
				toastSuccess('Cita finalizada', `La evaluación de ${data.cita.paciente.nombre} ${data.cita.paciente.apellido} fue guardada y la cita marcada como atendida.`);
				saved = true;
				setTimeout(() => goto('/doctor/citas'), 1500);
			} else {
				const errMsg = result.type === 'failure' ? ((result.data as Record<string, string>)?.error ?? 'Error desconocido') : 'No se pudo finalizar la cita.';
				toastError('Error', errMsg);
			}
		} catch {
			toastError('Error de conexión', 'Verifique su conexión e intente nuevamente.');
		} finally {
			finalizing = false;
		}
	}

	// Autosave silencioso via fetch directo (no necesita enhance lifecycle)
	async function handleAutosave(formData: Record<string, unknown>) {
		const body = new FormData();
		body.set('evaluacion', JSON.stringify(mergeAllData(formData)));
		body.set('schema_id', data.formSchema.id);
		body.set('schema_version', data.formSchema.version);

		await fetch(`?/autosave`, { method: 'POST', body });
	}

	// Autosave debounced para cambios en secciones universales
	let universalAutosaveTimer: ReturnType<typeof setTimeout> | undefined;
	function scheduleUniversalAutosave() {
		if (isReadonly || !formEngineRef?.store) return;
		clearTimeout(universalAutosaveTimer);
		universalAutosaveTimer = setTimeout(() => {
			handleAutosave(formEngineRef!.store.getSubmitData());
		}, 3000);
	}

	// Cleanup del timer al desmontar
	$effect(() => {
		return () => {
			clearTimeout(universalAutosaveTimer);
		};
	});

	// Detectar cambios en secciones universales (flag simple, no JSON.stringify en cada tick)
	const initialObservaciones = (evalData.observaciones as string) ?? '';
	let recetaTouched = $state(false);
	let universalDirty = $derived(
		observaciones !== initialObservaciones || recetaTouched
	);

	// Guarda de navegación
	if (browser) {
		beforeNavigate((navigation) => {
			const isDirty = formEngineRef?.store?.isDirty || universalDirty;
			const isSaving = formEngineRef?.store?.isSaving;
			if (isDirty && !isSaving && !saved) {
				navigation.cancel();
				pendingNavigation = navigation as unknown as typeof pendingNavigation;
				showLeaveDialog = true;
			}
		});

		// También proteger cierre del navegador (con cleanup)
		$effect(() => {
			function onBeforeUnload(e: BeforeUnloadEvent) {
				if (formEngineRef?.store?.isDirty || universalDirty) {
					e.preventDefault();
				}
			}
			window.addEventListener('beforeunload', onBeforeUnload);
			return () => window.removeEventListener('beforeunload', onBeforeUnload);
		});
	}
</script>

<svelte:head>
	<title>Evaluación — {data.cita.paciente.nombre} {data.cita.paciente.apellido}</title>
</svelte:head>

<div class="animate-fade-in-up">
	<!-- Breadcrumb + Header -->
	<div class="mb-5 space-y-3">
		<div class="flex items-center gap-2 text-sm text-ink-muted">
			<a href="/doctor/citas" class="hover:text-ink transition-colors">Mis citas</a>
			<span>›</span>
			<span class="text-ink"
				>{data.cita.paciente.nombre} {data.cita.paciente.apellido}</span
			>
		</div>

		<div class="flex items-start justify-between flex-wrap gap-3">
			<div>
				<h1 class="text-display text-xl font-bold text-ink">
					{data.cita.paciente.nombre} {data.cita.paciente.apellido}
				</h1>
				<p class="text-sm text-ink-muted mt-0.5">
					{data.cita.fecha} · {data.cita.hora_inicio} · {data.cita.duracion_min} min
					· {data.formSchema.specialtyName}
				</p>
			</div>
			<AppointmentStatusBadge status={data.cita.estado} />
		</div>
	</div>

	<!-- Feedback via Toast -->

	<!-- Dashboard Split-Screen -->
	<div class="consultation-dashboard">
		<!-- LEFT: Patient Insights -->
		<PatientInsightsPanel
			paciente={data.cita.paciente}
			cita={data.cita}
			previousHistories={data.previousHistories}
			class="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-thin"
		/>

		<!-- RIGHT: Dynamic Form + Universal Sections -->
		<div class="min-w-0 space-y-5">
			<!-- ═══ SECCIÓN 1: Formulario de Evaluación (por especialidad) ═══ -->
			<FormEngine
				bind:this={formEngineRef}
				schema={data.formSchema}
				initialData={evalData}
				readonly={isReadonly}
				onSave={handleSave}
				onAutosave={isReadonly ? undefined : handleAutosave}
			/>

			<!-- ═══ SECCIÓN 2: Notas y Observaciones ═══ -->
			<ObservacionesSection
				value={observaciones}
				disabled={isReadonly}
				onchange={(v) => { observaciones = v; scheduleUniversalAutosave(); }}
			/>

			<!-- ═══ SECCIÓN 3: Órdenes médicas ═══ -->
			<div class="space-y-4">
				<div class="flex items-center gap-2 px-1">
					<div class="h-px flex-1 bg-border/40"></div>
					<span class="text-xs font-semibold text-ink-muted uppercase tracking-wider shrink-0">Órdenes Médicas</span>
					<div class="h-px flex-1 bg-border/40"></div>
				</div>

				<ExamenesSection
					items={examenesSolicitados}
					disabled={isReadonly}
					onchange={(items) => { examenesSolicitados = items; scheduleUniversalAutosave(); }}
				/>

				<PrescriptionSection
					items={recetaItems}
					disabled={isReadonly}
					medicationOptions={data.medicationOptions}
					onchange={(items) => { recetaItems = items; recetaTouched = true; scheduleUniversalAutosave(); }}
					onEmitRecipe={isReadonly ? undefined : handleEmitRecipe}
					recipeEmitted={recipeEmitted}
					emitting={emittingRecipe}
				/>
			</div>

			<!-- Botón finalizar cita (guardar + marcar atendida) -->
			{#if !isReadonly && data.cita.estado !== 'atendida'}
				<div class="bg-surface-elevated border border-border/60 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-ink">¿Terminó la consulta?</p>
						<p class="text-xs text-ink-muted mt-0.5">Guarda la evaluación y marca la cita como atendida.</p>
					</div>
					<Button
						variant="primary"
						size="md"
						isLoading={finalizing}
						onclick={handleFinalize}
					>
						Guardar y finalizar cita
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Guardado ahora es via fetch directo, no hidden form -->
</div>

<!-- Dialog: Confirmar salida con cambios sin guardar -->
<Dialog open={showLeaveDialog} onClose={() => { showLeaveDialog = false; pendingNavigation = null; }} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">Cambios sin guardar</h2>
	</DialogHeader>
	<DialogBody>
		<p class="text-sm text-ink">Hay cambios en la evaluación que no se han guardado. ¿Desea salir sin guardar?</p>
		<p class="text-xs text-ink-muted mt-2">Los cambios no guardados se perderán.</p>
	</DialogBody>
	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={() => { showLeaveDialog = false; pendingNavigation = null; }}>
			Seguir editando
		</Button>
		<Button type="button" variant="danger" size="md" onclick={() => {
			showLeaveDialog = false;
			const nav = pendingNavigation;
			pendingNavigation = null;
			// Navegar a la URL pendiente
			const targetUrl = nav?.to?.url?.pathname ?? nav?.url?.pathname ?? '/doctor/citas';
			saved = true; // Evitar que beforeNavigate bloquee de nuevo
			goto(targetUrl);
		}}>
			Salir sin guardar
		</Button>
	</DialogFooter>
</Dialog>

<style>
	.consultation-dashboard {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}

	@media (min-width: 1024px) {
		.consultation-dashboard {
			grid-template-columns: 340px 1fr;
			gap: 1.5rem;
			align-items: start;
		}
	}
</style>
