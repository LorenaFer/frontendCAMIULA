<script lang="ts">
	import type { MedicationOption, PrescriptionItemDraft } from '$domain/inventory/types.js';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	interface SubmitResult {
		success?: boolean;
		prescriptionNumber?: string;
		error?: string;
	}

	interface Props {
		medicationOptions: MedicationOption[];
		items: PrescriptionItemDraft[];
		notes: string;
		submitting: boolean;
		submitResult: SubmitResult | null;
		onAddItem: (medication: MedicationOption) => void;
		onRemoveItem: (medicationId: string) => void;
		onItemChange: (medicationId: string, field: keyof Omit<PrescriptionItemDraft, 'medication_id' | 'medication_name' | 'pharmaceutical_form' | 'unit_measure'>, value: string | number) => void;
		onNotesChange: (value: string) => void;
		onSubmit: () => void;
	}

	let {
		medicationOptions,
		items,
		notes,
		submitting,
		submitResult,
		onAddItem,
		onRemoveItem,
		onItemChange,
		onNotesChange,
		onSubmit
	}: Props = $props();

	// Búsqueda local de medicamentos para el selector
	let medSearch = $state('');

	const filteredOptions = $derived(
		medSearch.trim().length < 1
			? medicationOptions.slice(0, 8)
			: medicationOptions.filter((m) => {
					const q = medSearch.toLowerCase();
					return (
						m.generic_name.toLowerCase().includes(q) ||
						m.code.toLowerCase().includes(q)
					);
			  }).slice(0, 10)
	);

	const alreadyAdded = $derived(new Set(items.map((i) => i.medication_id)));

	function selectMedication(med: MedicationOption) {
		if (alreadyAdded.has(med.id)) return;
		onAddItem(med);
		medSearch = '';
	}
</script>

<div class="space-y-5">

	<!-- Buscador de medicamentos -->
	<div class="space-y-2">
		<label class="block text-sm font-medium text-ink">
			Agregar medicamento
			<input
				id="med-search"
				type="search"
				placeholder="Buscar por nombre genérico o código..."
				bind:value={medSearch}
				disabled={submitting}
				class="mt-1 w-full h-9 px-3 text-sm rounded-lg border border-border
				       bg-surface-elevated text-ink placeholder:text-ink-subtle
				       hover:border-border-strong
				       focus:outline-none focus:border-viking-400
				       focus:ring-2 focus:ring-viking-100/60
				       disabled:bg-canvas-subtle disabled:text-ink-subtle
				       disabled:cursor-not-allowed"
			/>
		</label>

		{#if medSearch.trim().length > 0 && filteredOptions.length > 0}
			<ul class="border border-border rounded-lg overflow-hidden bg-surface-elevated shadow-[var(--shadow-1)] divide-y divide-border/50">
				{#each filteredOptions as med (med.id)}
					<li>
						<button
							type="button"
							onclick={() => selectMedication(med)}
							disabled={alreadyAdded.has(med.id) || submitting}
							class="w-full flex items-center justify-between px-3 py-2.5 text-sm
							       hover:bg-canvas-subtle/70 transition-colors text-left
							       disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<span>
								<span class="font-medium text-ink">{med.generic_name}</span>
								<span class="text-ink-muted ml-1.5">{med.pharmaceutical_form}</span>
							</span>
							<span class="text-xs text-ink-subtle font-mono shrink-0 ml-3">
								{med.code}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else if medSearch.trim().length > 0 && filteredOptions.length === 0}
			<p class="text-sm text-ink-muted px-1">Sin resultados para "{medSearch}"</p>
		{/if}
	</div>

	<!-- Lista de ítems agregados -->
	{#if items.length > 0}
		<div class="space-y-2">
			<p class="text-sm font-medium text-ink">Medicamentos en la receta</p>
			<ul class="space-y-2">
				{#each items as item (item.medication_id)}
					<li class="bg-canvas-subtle/60 border border-border/60 rounded-lg p-3 space-y-3">
						<!-- Encabezado del ítem -->
						<div class="flex items-start justify-between gap-2">
							<div>
								<p class="text-sm font-medium text-ink">{item.medication_name}</p>
								<p class="text-xs text-ink-muted">{item.pharmaceutical_form}</p>
							</div>
							<button
								type="button"
								onclick={() => onRemoveItem(item.medication_id)}
								disabled={submitting}
								class="text-ink-subtle hover:text-red-600 transition-colors p-1 rounded
								       disabled:pointer-events-none"
								aria-label="Quitar {item.medication_name}"
							>
								<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
									<path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
								</svg>
							</button>
						</div>

						<!-- Campos del ítem -->
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
							<div>
								<label for="{item.medication_id}-qty" class="block text-xs font-medium text-ink-muted mb-1">
									Cantidad ({item.unit_measure})
								</label>
								<input
									id="{item.medication_id}-qty"
									type="number"
									min="1"
									value={item.quantity_prescribed}
									oninput={(e) =>
										onItemChange(
											item.medication_id,
											'quantity_prescribed',
											Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1)
										)}
									disabled={submitting}
									class="w-full h-9 px-3 text-sm rounded-lg border border-border
									       bg-surface-elevated text-ink
									       hover:border-border-strong
									       focus:outline-none focus:border-viking-400
									       focus:ring-2 focus:ring-viking-100/60
									       disabled:bg-canvas-subtle disabled:text-ink-subtle
									       disabled:cursor-not-allowed tabular-nums"
								/>
							</div>

							<div>
								<label for="{item.medication_id}-days" class="block text-xs font-medium text-ink-muted mb-1">
									Días de tratamiento
								</label>
								<input
									id="{item.medication_id}-days"
									type="number"
									min="1"
									value={item.duration_days}
									oninput={(e) =>
										onItemChange(
											item.medication_id,
											'duration_days',
											Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1)
										)}
									disabled={submitting}
									class="w-full h-9 px-3 text-sm rounded-lg border border-border
									       bg-surface-elevated text-ink
									       hover:border-border-strong
									       focus:outline-none focus:border-viking-400
									       focus:ring-2 focus:ring-viking-100/60
									       disabled:bg-canvas-subtle disabled:text-ink-subtle
									       disabled:cursor-not-allowed tabular-nums"
								/>
							</div>

							<div class="sm:col-span-1">
								<label for="{item.medication_id}-dosage" class="block text-xs font-medium text-ink-muted mb-1">
									Instrucciones de dosis
								</label>
								<input
									id="{item.medication_id}-dosage"
									type="text"
									placeholder="ej: 1 cápsula cada 8 horas"
									value={item.dosage_instructions}
									oninput={(e) =>
										onItemChange(
											item.medication_id,
											'dosage_instructions',
											(e.target as HTMLInputElement).value
										)}
									disabled={submitting}
									class="w-full h-9 px-3 text-sm rounded-lg border border-border
									       bg-surface-elevated text-ink placeholder:text-ink-subtle
									       hover:border-border-strong
									       focus:outline-none focus:border-viking-400
									       focus:ring-2 focus:ring-viking-100/60
									       disabled:bg-canvas-subtle disabled:text-ink-subtle
									       disabled:cursor-not-allowed"
								/>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Notas generales -->
	<div class="space-y-1.5">
		<label class="block text-sm font-medium text-ink" for="prescription-notes">
			Observaciones generales
			<span class="text-ink-subtle font-normal">(opcional)</span>
		</label>
		<textarea
			id="prescription-notes"
			rows="2"
			placeholder="Indicaciones adicionales para el paciente..."
			value={notes}
			oninput={(e) => onNotesChange((e.target as HTMLTextAreaElement).value)}
			disabled={submitting}
			class="w-full px-3 py-2 text-sm rounded-lg border border-border
			       bg-surface-elevated text-ink placeholder:text-ink-subtle
			       hover:border-border-strong resize-none
			       focus:outline-none focus:border-viking-400
			       focus:ring-2 focus:ring-viking-100/60
			       disabled:bg-canvas-subtle disabled:text-ink-subtle
			       disabled:cursor-not-allowed"
		></textarea>
	</div>

	<!-- Resultado previo -->
	{#if submitResult?.success}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-sage-50 border border-sage-200
		            dark:bg-sage-900/20 dark:border-sage-700">
			<svg class="w-4 h-4 text-sage-600 shrink-0" viewBox="0 0 16 16" fill="currentColor">
				<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
			</svg>
			<span class="text-sm text-sage-800 dark:text-sage-300">
				Receta emitida:
				<span class="font-mono font-semibold">{submitResult.prescriptionNumber}</span>
			</span>
		</div>
	{:else if submitResult?.error}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200
		            dark:bg-red-900/20 dark:border-red-700">
			<svg class="w-4 h-4 text-red-600 shrink-0" viewBox="0 0 16 16" fill="currentColor">
				<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 4.5Zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11Z" />
			</svg>
			<span class="text-sm text-red-800 dark:text-red-300">{submitResult.error}</span>
		</div>
	{/if}

	<!-- Submit -->
	<div class="flex justify-end">
		<Button
			variant="primary"
			disabled={items.length === 0 || submitting}
			isLoading={submitting}
			onclick={onSubmit}
		>
			{submitting ? 'Emitiendo...' : 'Emitir Receta'}
		</Button>
	</div>
</div>
