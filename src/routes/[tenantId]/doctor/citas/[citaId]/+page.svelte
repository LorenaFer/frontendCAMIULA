<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import FormEngine from '$shared/components/form-engine/FormEngine.svelte';
	import ObservacionesSection from '$shared/components/form-engine/ObservacionesSection.svelte';
	import PrescriptionSection from '$shared/components/form-engine/PrescriptionSection.svelte';
	import ExamenesSection from '$shared/components/form-engine/ExamenesSection.svelte';
	import type { ExamenSolicitado } from '$shared/components/form-engine/ExamenesSection.svelte';
	import PatientInsightsPanel from '$shared/components/form-engine/PatientInsightsPanel.svelte';
	import type { PrescriptionItem } from '$shared/types/prescription.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);
	const isReadonly = $derived(data.cita.estado === 'cancelada');

	// Estado para el form oculto de guardado
	let evaluacionJson = $state('{}');
	const schemaId = data.formSchema.id;
	const schemaVersion = data.formSchema.version;
	let saved = $state(false);
	let formEngineRef: { store: import('$shared/components/form-engine/FormStore.svelte.js').FormStore } | undefined;

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

	// Guardar evaluación (submit del FormEngine → serializa al hidden form)
	async function handleSave(formData: Record<string, unknown>) {
		evaluacionJson = JSON.stringify(mergeAllData(formData));
		// Pequeño tick para que Svelte actualice los bindings del hidden form
		await new Promise((r) => setTimeout(r, 0));
		const hiddenForm = document.getElementById('eval-form') as HTMLFormElement;
		hiddenForm?.requestSubmit();
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
			}
		} catch {
			// Error silencioso — el usuario verá que el botón no cambió
		} finally {
			emittingRecipe = false;
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
			if (isDirty && !isSaving) {
				if (!confirm('Hay cambios sin guardar. ¿Desea salir de la evaluación?')) {
					navigation.cancel();
				}
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
			<a href="/{tenantId}/doctor/citas" class="hover:text-ink transition-colors">Mis citas</a>
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

	<!-- Mensaje de guardado exitoso -->
	{#if form?.success || saved}
		<div
			class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300"
		>
			Evaluación guardada correctamente.
		</div>
	{/if}

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
		<div class="min-w-0 space-y-4">
			<FormEngine
				bind:this={formEngineRef}
				schema={data.formSchema}
				initialData={evalData}
				readonly={isReadonly}
				onSave={handleSave}
				onAutosave={isReadonly ? undefined : handleAutosave}
			/>

			<!-- Secciones universales (independientes del schema de especialidad) -->
			<ObservacionesSection
				value={observaciones}
				disabled={isReadonly}
				onchange={(v) => { observaciones = v; scheduleUniversalAutosave(); }}
			/>

			<ExamenesSection
				items={examenesSolicitados}
				disabled={isReadonly}
				onchange={(items) => { examenesSolicitados = items; scheduleUniversalAutosave(); }}
			/>

			<PrescriptionSection
				items={recetaItems}
				disabled={isReadonly}
				onchange={(items) => { recetaItems = items; recetaTouched = true; scheduleUniversalAutosave(); }}
				onEmitRecipe={isReadonly ? undefined : handleEmitRecipe}
				recipeEmitted={recipeEmitted}
				emitting={emittingRecipe}
			/>
		</div>
	</div>

	<!-- Hidden form for SvelteKit action submission -->
	<form
		id="eval-form"
		method="POST"
		action="?/guardarEvaluacion"
		class="hidden"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') saved = true;
			};
		}}
	>
		<input type="hidden" name="evaluacion" value={evaluacionJson} />
		<input type="hidden" name="schema_id" value={schemaId} />
		<input type="hidden" name="schema_version" value={schemaVersion} />
	</form>
</div>

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
