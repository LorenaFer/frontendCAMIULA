<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { MedicationOption, PrescriptionItemDraft } from '$domain/inventory/types.js';
	import Card from '$shared/components/card/Card.svelte';
	import PrescriptionForm from '$domain/inventory/components/PrescriptionForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let items = $state<PrescriptionItemDraft[]>([]);
	let notes = $state('');
	let submitting = $state(false);

	// Mapa oculto para serializar ítems al servidor
	let itemsJson = $derived(
		JSON.stringify(
			items.map((i) => ({
				medication_id: i.medication_id,
				quantity_prescribed: i.quantity_prescribed,
				dosage_instructions: i.dosage_instructions || undefined,
				duration_days: i.duration_days > 0 ? i.duration_days : undefined
			}))
		)
	);

	const submitResult = $derived(
		form?.success
			? { success: true, prescriptionNumber: (form as { prescriptionNumber?: string }).prescriptionNumber }
			: form?.error
			  ? { error: (form as { error: string }).error }
			  : null
	);

	function handleAddItem(med: MedicationOption) {
		items = [
			...items,
			{
				medication_id: med.id,
				medication_name: med.generic_name,
				pharmaceutical_form: med.pharmaceutical_form,
				unit_measure: med.unit_measure,
				quantity_prescribed: 1,
				dosage_instructions: '',
				duration_days: 7
			}
		];
	}

	function handleRemoveItem(medicationId: string) {
		items = items.filter((i) => i.medication_id !== medicationId);
	}

	function handleItemChange(
		medicationId: string,
		field: keyof Omit<PrescriptionItemDraft, 'medication_id' | 'medication_name' | 'pharmaceutical_form' | 'unit_measure'>,
		value: string | number
	) {
		items = items.map((i) =>
			i.medication_id === medicationId ? { ...i, [field]: value } : i
		);
	}

	function handleNotesChange(value: string) {
		notes = value;
	}

	// La receta ya existe — no permitir nueva emisión
	const alreadyIssued = $derived(data.existingPrescription !== null);

	const citaId = $derived($page.params.citaId);
</script>

<svelte:head>
	<title>Emitir Receta — Cita {data.cita.id}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6 animate-fade-in-up max-w-3xl">
	<div>
		<div class="flex items-center gap-2 text-xs text-ink-muted mb-1">
			<a href="/doctor/citas/{citaId}" class="hover:text-ink transition-colors">← Volver a la cita</a>
		</div>
		<h1 class="text-lg sm:text-xl font-bold text-ink">Emitir Receta</h1>
		<p class="text-xs text-ink-muted mt-0.5">
			Cita #{data.cita.id} · {data.cita.paciente?.nombre ?? 'Paciente'} {data.cita.paciente?.apellido ?? ''}
		</p>
	</div>

	<!-- Receta ya emitida -->
	{#if alreadyIssued && data.existingPrescription}
		<Card padding="md">
			<div class="flex items-start gap-3">
				<svg class="w-5 h-5 text-sage-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
				<div>
					<p class="text-sm font-medium text-ink">Receta ya emitida para esta cita</p>
					<p class="text-xs text-ink-muted mt-0.5">
						Número: <span class="font-mono font-semibold">{data.existingPrescription.prescription_number}</span>
						· {data.existingPrescription.items.length} medicamento(s)
					</p>
				</div>
			</div>
		</Card>
	{:else}
		<!-- Formulario de emisión -->
		<Card padding="md">
			<form
				method="POST"
				action="?/emitirRecipe"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						await update({ reset: false });
						if (result.type === 'success') {
							items = [];
							notes = '';
						}
					};
				}}
			>
				<!-- Campo oculto con ítems serializados -->
				<input type="hidden" name="items" value={itemsJson} />
				<input type="hidden" name="notes" value={notes} />

				<PrescriptionForm
					medicationOptions={data.medicationOptions}
					{items}
					{notes}
					{submitting}
					{submitResult}
					onAddItem={handleAddItem}
					onRemoveItem={handleRemoveItem}
					onItemChange={handleItemChange}
					onNotesChange={handleNotesChange}
					onSubmit={() => {}}
				/>
			</form>
		</Card>
	{/if}
</div>
