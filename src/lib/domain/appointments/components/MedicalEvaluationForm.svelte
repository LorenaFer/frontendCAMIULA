<script lang="ts">
	import type { CitaConPaciente } from '$domain/appointments/types.js';
	import type { HistoriaMedica, Evaluacion } from '$domain/medical-records/types.js';
	import Input from '$shared/components/input/Input.svelte';
	import Button from '$shared/components/button/Button.svelte';

	interface Props {
		cita: CitaConPaciente;
		historia?: HistoriaMedica;
		readonly?: boolean;
		onSave: (evaluacion: Evaluacion) => void;
		class?: string;
	}

	let { cita, historia, readonly = false, onSave, class: className = '' }: Props = $props();

	let evaluacion = $state<Evaluacion>({
		motivo_consulta: historia?.evaluacion.motivo_consulta ?? cita.motivo_consulta ?? '',
		anamnesis: historia?.evaluacion.anamnesis ?? '',
		examen_fisico: {
			ta: historia?.evaluacion.examen_fisico?.ta ?? '',
			fc: historia?.evaluacion.examen_fisico?.fc ?? '',
			fr: historia?.evaluacion.examen_fisico?.fr ?? '',
			temp: historia?.evaluacion.examen_fisico?.temp ?? '',
			peso: historia?.evaluacion.examen_fisico?.peso ?? '',
			talla: historia?.evaluacion.examen_fisico?.talla ?? ''
		},
		diagnostico: {
			cie10: historia?.evaluacion.diagnostico?.cie10 ?? '',
			descripcion: historia?.evaluacion.diagnostico?.descripcion ?? ''
		},
		tratamiento: historia?.evaluacion.tratamiento ?? '',
		indicaciones: historia?.evaluacion.indicaciones ?? ''
	});

	let saving = $state(false);

	async function handleSave() {
		saving = true;
		try {
			await onSave(evaluacion);
		} finally {
			saving = false;
		}
	}
</script>

<form
	class="space-y-6 {className}"
	onsubmit={(e) => { e.preventDefault(); handleSave(); }}
>
	<!-- Info del paciente (solo lectura) -->
	<div class="p-4 bg-surface-elevated rounded-lg border border-border">
		<h3 class="text-sm font-semibold text-ink mb-2">Datos del Paciente</h3>
		<div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
			<span><b>Paciente:</b> {cita.paciente.nombre} {cita.paciente.apellido}</span>
			<span><b>NHM:</b> {cita.paciente.nhm}</span>
			<span><b>Cédula:</b> {cita.paciente.cedula}</span>
			<span><b>Fecha:</b> {cita.fecha} {cita.hora_inicio}</span>
			{#if cita.es_primera_vez}
				<span class="text-viking-600 font-medium">★ Primera consulta</span>
			{/if}
		</div>
	</div>

	<!-- Motivo y anamnesis -->
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-ink mb-1" for="motivo">Motivo de consulta</label>
			<textarea
				id="motivo"
				rows="2"
				disabled={readonly}
				bind:value={evaluacion.motivo_consulta}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-viking-500 disabled:opacity-60"
				placeholder="Describa el motivo principal de la consulta..."
			></textarea>
		</div>

		<div>
			<label class="block text-sm font-medium text-ink mb-1" for="anamnesis">Anamnesis</label>
			<textarea
				id="anamnesis"
				rows="4"
				disabled={readonly}
				bind:value={evaluacion.anamnesis}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-viking-500 disabled:opacity-60"
				placeholder="Historia clínica, antecedentes, evolución del cuadro..."
			></textarea>
		</div>
	</div>

	<!-- Examen físico -->
	<div>
		<h4 class="text-sm font-semibold text-ink mb-3">Examen Físico</h4>
		<div class="flex flex-wrap gap-3">
			{#each [
				{ key: 'ta', label: 'T.A. (mmHg)', placeholder: '120/80' },
				{ key: 'fc', label: 'F.C. (lpm)', placeholder: '72' },
				{ key: 'fr', label: 'F.R. (rpm)', placeholder: '16' },
				{ key: 'temp', label: 'Temp (°C)', placeholder: '36.5' },
				{ key: 'peso', label: 'Peso (kg)', placeholder: '70' },
				{ key: 'talla', label: 'Talla (m)', placeholder: '1.70' }
			] as field}
				<div class="flex-1 min-w-28">
					<Input
						label={field.label}
						placeholder={field.placeholder}
						disabled={readonly}
						value={evaluacion.examen_fisico?.[field.key as keyof typeof evaluacion.examen_fisico] ?? ''}
						oninput={(e) => {
							evaluacion.examen_fisico = {
								...evaluacion.examen_fisico,
								[field.key]: (e.target as HTMLInputElement).value
							};
						}}
					/>
				</div>
			{/each}
		</div>
	</div>

	<!-- Diagnóstico -->
	<div>
		<h4 class="text-sm font-semibold text-ink mb-3">Diagnóstico</h4>
		<div class="flex flex-wrap gap-3">
			<div class="w-36">
				<Input
					label="Código CIE-10"
					placeholder="J00"
					disabled={readonly}
					value={evaluacion.diagnostico?.cie10 ?? ''}
					oninput={(e) => {
						evaluacion.diagnostico = {
							...evaluacion.diagnostico,
							cie10: (e.target as HTMLInputElement).value.toUpperCase()
						};
					}}
				/>
			</div>
			<div class="flex-1 min-w-48">
				<Input
					label="Descripción diagnóstica"
					placeholder="Ej: Rinofaringitis aguda"
					disabled={readonly}
					value={evaluacion.diagnostico?.descripcion ?? ''}
					oninput={(e) => {
						evaluacion.diagnostico = {
							...evaluacion.diagnostico,
							descripcion: (e.target as HTMLInputElement).value
						};
					}}
				/>
			</div>
		</div>
	</div>

	<!-- Tratamiento e indicaciones -->
	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-ink mb-1" for="tratamiento">Tratamiento</label>
			<textarea
				id="tratamiento"
				rows="3"
				disabled={readonly}
				bind:value={evaluacion.tratamiento}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-viking-500 disabled:opacity-60"
				placeholder="Medicamentos, dosis, frecuencia..."
			></textarea>
		</div>

		<div>
			<label class="block text-sm font-medium text-ink mb-1" for="indicaciones">Indicaciones</label>
			<textarea
				id="indicaciones"
				rows="3"
				disabled={readonly}
				bind:value={evaluacion.indicaciones}
				class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-viking-500 disabled:opacity-60"
				placeholder="Reposo, dieta, cuidados especiales..."
			></textarea>
		</div>
	</div>

	{#if !readonly}
		<div class="flex justify-end gap-3 pt-2 border-t border-border">
			<Button type="submit" variant="primary" isLoading={saving}>
				Guardar evaluación
			</Button>
		</div>
	{/if}
</form>
