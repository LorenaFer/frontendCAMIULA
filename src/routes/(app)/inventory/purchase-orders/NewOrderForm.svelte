<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SupplierOption, MedicationOption } from '$shared/types/inventory.js';
	import MedicationSelector from '$shared/components/inventory/MedicationSelector.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
	import Textarea from '$shared/components/input/Textarea.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let {
		supplierOptions,
		medicationOptions,
		onCancel
	}: {
		supplierOptions: SupplierOption[];
		medicationOptions: MedicationOption[];
		onCancel: () => void;
	} = $props();

	interface ItemDraft {
		_key: number;
		medication: MedicationOption | null;
		quantity_ordered: number;
		unit_cost: number;
	}

	let submitting = $state(false);
	let selectedSupplierId = $state('');
	let expectedDate = $state('');
	let notes = $state('');
	let items = $state<ItemDraft[]>([{ _key: 0, medication: null, quantity_ordered: 1, unit_cost: 0 }]);

	const supplierSelectOptions = $derived([
		{ value: '', label: 'Seleccionar proveedor...' },
		...supplierOptions.map((s) => ({ value: s.id, label: s.name }))
	]);
	let keyCounter = 1;

	function addItem() {
		items = [...items, { _key: keyCounter++, medication: null, quantity_ordered: 1, unit_cost: 0 }];
	}

	function removeItem(key: number) {
		items = items.filter((i) => i._key !== key);
	}

	const serializedItems = $derived(
		JSON.stringify(
			items
				.filter((i) => i.medication !== null)
				.map((i) => ({
					medication_id: i.medication!.id,
					quantity_ordered: i.quantity_ordered,
					unit_cost: i.unit_cost
				}))
		)
	);

	const isValid = $derived(
		items.some((i) => i.medication !== null && i.quantity_ordered > 0)
	);
</script>

<form
	method="POST"
	action="?/crearOrden"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			await update();
			if (result.type === 'success') {
				toastSuccess('Orden creada', 'La orden de compra fue creada correctamente.');
				onCancel();
			} else if (result.type === 'failure') {
				toastError('Error al crear orden', (result.data as { error?: string })?.error ?? 'No se pudo crear la orden de compra.');
			}
			await invalidateAll();
		};
	}}
	class="space-y-4 rounded-xl border border-border bg-surface-elevated p-4 sm:p-6 animate-fade-in-up"
>
	<div class="flex items-center justify-between">
		<h2 class="text-base font-semibold text-ink">Nueva Orden de Compra</h2>
		<button
			type="button"
			onclick={onCancel}
			class="p-1.5 text-ink-subtle hover:text-ink rounded-lg hover:bg-canvas-subtle transition-colors"
			aria-label="Cerrar formulario"
		>
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<Select
			label="Proveedor *"
			options={supplierSelectOptions}
			value={selectedSupplierId}
			onchange={(v) => { if (typeof v === 'string') selectedSupplierId = v; }}
		/>
		<DateInput
			label="Fecha esperada"
			bind:value={expectedDate}
		/>
	</div>
	<input type="hidden" name="fk_supplier_id" value={selectedSupplierId} />
	<input type="hidden" name="expected_date" value={expectedDate} />

	<Textarea
		label="Notas"
		value={notes}
		placeholder="Observaciones opcionales..."
		rows={2}
		oninput={(e) => { notes = e.currentTarget.value; }}
	/>
	<input type="hidden" name="notes" value={notes} />

	<!-- Items -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-ink">Medicamentos</span>
			<Button type="button" variant="ghost" size="md" onclick={addItem}>+ Agregar ítem</Button>
		</div>

		{#each items as item (item._key)}
			<div class="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2 items-end p-3 rounded-lg bg-canvas-subtle border border-border">
				<div>
					<label class="block text-sm font-medium text-ink-muted mb-1">Medicamento</label>
					<MedicationSelector
						options={medicationOptions}
						selected={item.medication}
						onSelect={(med) => { item.medication = med; }}
						onClear={() => { item.medication = null; }}
					/>
				</div>
				<div>
					<label for="qty-{item._key}" class="block text-sm font-medium text-ink-muted mb-1">Cantidad</label>
					<input
						id="qty-{item._key}"
						type="number"
						min="1"
						bind:value={item.quantity_ordered}
						class="w-full px-2 py-2 text-sm rounded-lg border border-border bg-surface-elevated text-ink focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
					/>
				</div>
				<div>
					<label for="cost-{item._key}" class="block text-sm font-medium text-ink-muted mb-1">Costo unit.</label>
					<input
						id="cost-{item._key}"
						type="number"
						min="0"
						step="0.01"
						bind:value={item.unit_cost}
						class="w-full px-2 py-2 text-sm rounded-lg border border-border bg-surface-elevated text-ink focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
					/>
				</div>
				<button
					type="button"
					onclick={() => removeItem(item._key)}
					disabled={items.length === 1}
					class="mb-0.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
					aria-label="Eliminar ítem"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>
				</button>
			</div>
		{/each}
	</div>

	<input type="hidden" name="items" value={serializedItems} />

	<div class="flex items-center justify-end gap-3 pt-2 border-t border-border">
		<Button type="button" variant="ghost" size="md" onclick={onCancel}>Cancelar</Button>
		<Button type="submit" variant="primary" size="md" isLoading={submitting} disabled={!isValid}>
			Crear orden
		</Button>
	</div>
</form>
