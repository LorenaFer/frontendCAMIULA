<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { Evaluacion } from '$shared/types/appointments.js';
	import MedicalEvaluationForm from '$shared/components/appointments/MedicalEvaluationForm.svelte';
	import AppointmentStatusBadge from '$shared/components/appointments/AppointmentStatusBadge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tenantId = $derived($page.params.tenantId);

	let saved = $state(false);
	let evaluacionActual = $state<Evaluacion>(data.historia?.evaluacion ?? {});

	// La ruta guarda via form action — el componente delega aquí
	async function handleSave(evaluacion: Evaluacion) {
		evaluacionActual = evaluacion;
		// Disparar el form hidden programáticamente
		document.getElementById('eval-form')?.dispatchEvent(new Event('submit', { bubbles: true }));
	}
</script>

<svelte:head>
	<title>Evaluación — {data.cita.paciente.nombre} {data.cita.paciente.apellido}</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm text-ink-muted">
		<a href="/{tenantId}/doctor/citas" class="hover:text-ink transition-colors">Mis citas</a>
		<span>›</span>
		<span class="text-ink">Evaluación #{data.cita.id}</span>
	</div>

	<!-- Header de la cita -->
	<div class="flex items-start justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-display text-xl font-bold text-ink">
				{data.cita.paciente.nombre} {data.cita.paciente.apellido}
			</h1>
			<p class="text-sm text-ink-muted mt-0.5">
				{data.cita.fecha} · {data.cita.hora_inicio} · {data.cita.duracion_min} min
			</p>
		</div>
		<AppointmentStatusBadge status={data.cita.estado} />
	</div>

	<!-- Mensaje de guardado exitoso -->
	{#if form?.success || saved}
		<div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
			Evaluación guardada correctamente.
		</div>
	{/if}

	<!-- Formulario de evaluación -->
	<div class="bg-surface rounded-xl border border-border p-6">
		<MedicalEvaluationForm
			cita={data.cita}
			historia={data.historia ?? undefined}
			readonly={data.cita.estado === 'cancelada'}
			onSave={handleSave}
		/>
	</div>

	<!--
		Form oculto que envía los datos de evaluación via SvelteKit action.
		MedicalEvaluationForm llama a onSave → que popula estos campos → submit.
	-->
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
		<input type="hidden" name="motivo_consulta" value={evaluacionActual.motivo_consulta ?? ''} />
		<input type="hidden" name="anamnesis" value={evaluacionActual.anamnesis ?? ''} />
		<input type="hidden" name="ef_ta" value={evaluacionActual.examen_fisico?.ta ?? ''} />
		<input type="hidden" name="ef_fc" value={evaluacionActual.examen_fisico?.fc ?? ''} />
		<input type="hidden" name="ef_fr" value={evaluacionActual.examen_fisico?.fr ?? ''} />
		<input type="hidden" name="ef_temp" value={evaluacionActual.examen_fisico?.temp ?? ''} />
		<input type="hidden" name="ef_peso" value={evaluacionActual.examen_fisico?.peso ?? ''} />
		<input type="hidden" name="ef_talla" value={evaluacionActual.examen_fisico?.talla ?? ''} />
		<input type="hidden" name="dx_cie10" value={evaluacionActual.diagnostico?.cie10 ?? ''} />
		<input type="hidden" name="dx_descripcion" value={evaluacionActual.diagnostico?.descripcion ?? ''} />
		<input type="hidden" name="tratamiento" value={evaluacionActual.tratamiento ?? ''} />
		<input type="hidden" name="indicaciones" value={evaluacionActual.indicaciones ?? ''} />
	</form>
</div>
