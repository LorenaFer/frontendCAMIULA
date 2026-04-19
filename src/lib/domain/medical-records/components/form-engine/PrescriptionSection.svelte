<script lang="ts">
	import EditableTable from '$shared/components/table/EditableTable.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import MedicationSelector from '$domain/inventory/components/widgets/MedicationSelector.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import type { EditableColumn } from '$shared/components/table/types';
	import type { MedicationOption } from '$domain/inventory/types.js';
	import {
		type PrescriptionItem,
		PRESENTACION_OPTIONS,
		VIA_OPTIONS,
		createPrescriptionItem
	} from '$domain/medical-records/prescription.js';

	interface Props {
		items: PrescriptionItem[];
		disabled?: boolean;
		onchange: (items: PrescriptionItem[]) => void;
		/** Medicamentos disponibles del inventario del hospital */
		medicationOptions?: MedicationOption[];
		/** Callback para emitir receta formal sin navegar */
		onEmitRecipe?: (items: PrescriptionItem[]) => void;
		/** Ya se emitió una receta para esta cita */
		recipeEmitted?: boolean;
		emitting?: boolean;
		class?: string;
	}

	let { items, disabled = false, onchange, medicationOptions = [], onEmitRecipe, recipeEmitted = false, emitting = false, class: className = '' }: Props = $props();

	let collapsed = $state(false);
	let medSearch = $state('');

	const medSuggestions = $derived.by(() => {
		const q = medSearch.trim().toLowerCase();
		if (q.length < 2 || medicationOptions.length === 0) return [];
		return medicationOptions
			.filter((m) => m.generic_name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
			.filter((m) => !items.some((i) => i.medication_id === m.id))
			.slice(0, 6);
	});

	// Mapea forma farmacéutica del inventario al value del select de presentación
	const formToPresentation: Record<string, string> = {
		'tableta': 'tabletas', 'tabletas': 'tabletas',
		'cápsula': 'capsulas', 'capsula': 'capsulas', 'cápsulas': 'capsulas',
		'jarabe': 'jarabe',
		'inyectable': 'inyectable',
		'crema': 'crema',
		'gotas': 'gotas',
		'suspensión': 'suspension', 'suspension': 'suspension',
		'solución': 'solucion', 'solucion': 'solucion',
		'supositorio': 'supositorio',
		'parche': 'parche',
		'inhalador': 'inhalador',
		'polvo': 'polvo',
		'ampolla': 'ampolla'
	};

	function addFromInventory(med: MedicationOption) {
		const newItem = createPrescriptionItem();
		newItem.medicamento = med.generic_name;
		newItem.medication_id = med.id;
		newItem.source = 'inventario';
		newItem.presentacion = formToPresentation[med.pharmaceutical_form?.toLowerCase() ?? ''] ?? '';
		newItem.dosis = med.concentration ?? '';
		onchange([...items, newItem]);
		medSearch = '';
	}

	function addExternal() {
		const newItem = createPrescriptionItem();
		newItem.medicamento = medSearch.trim();
		newItem.source = 'externo';
		onchange([...items, newItem]);
		medSearch = '';
	}

	const columns: EditableColumn<PrescriptionItem>[] = [
		{ key: 'medicamento', header: 'Medicamento', width: '22%', render: medicamentoCell },
		{ key: 'presentacion', header: 'Presentación', width: '12%', render: presentacionCell },
		{ key: 'dosis', header: 'Dosis', width: '10%', render: dosisCell },
		{ key: 'via', header: 'Vía', width: '12%', render: viaCell },
		{ key: 'frecuencia', header: 'Frecuencia', width: '11%', render: frecuenciaCell },
		{ key: 'duracion', header: 'Duración', width: '10%', render: duracionCell },
		{ key: 'cantidad', header: 'Cant.', width: '7%', align: 'center', render: cantidadCell },
		{ key: 'indicaciones', header: 'Indicaciones', width: '16%', render: indicacionesCell }
	];
</script>

<!-- Snippet renderers for each column -->

{#snippet medicamentoCell(value: PrescriptionItem[keyof PrescriptionItem], row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	{@const isFromInventory = row.source === 'inventario' && row.medication_id}
	<div class="flex items-center gap-1.5 px-2 py-1">
		{#if isFromInventory}
			<span class="w-1.5 h-1.5 rounded-full bg-viking-500 shrink-0" title="Del inventario del hospital"></span>
			<span class="text-sm text-ink truncate font-medium">{String(value ?? '')}</span>
		{:else}
			<span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Farmacia externa"></span>
			<input
				type="text"
				value={String(value ?? '')}
				placeholder="Nombre..."
				{disabled}
				oninput={(e) => onChange('medicamento', e.currentTarget.value)}
				class="flex-1 text-sm bg-transparent text-ink placeholder:text-ink-subtle outline-none"
			/>
		{/if}
	</div>
{/snippet}

{#snippet presentacionCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<select
		value={String(value ?? '')}
		{disabled}
		onchange={(e) => onChange('presentacion', e.currentTarget.value)}
		class="w-full px-1.5 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink outline-none transition-colors"
	>
		<option value="">—</option>
		{#each PRESENTACION_OPTIONS as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
{/snippet}

{#snippet dosisCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<input
		type="text"
		value={String(value ?? '')}
		placeholder="500mg"
		{disabled}
		oninput={(e) => onChange('dosis', e.currentTarget.value)}
		class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink placeholder:text-ink-subtle outline-none transition-colors"
	/>
{/snippet}

{#snippet viaCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<select
		value={String(value ?? '')}
		{disabled}
		onchange={(e) => onChange('via', e.currentTarget.value)}
		class="w-full px-1.5 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink outline-none transition-colors"
	>
		{#each VIA_OPTIONS as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
{/snippet}

{#snippet frecuenciaCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<input
		type="text"
		value={String(value ?? '')}
		placeholder="c/8h"
		{disabled}
		oninput={(e) => onChange('frecuencia', e.currentTarget.value)}
		class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink placeholder:text-ink-subtle outline-none transition-colors"
	/>
{/snippet}

{#snippet duracionCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<input
		type="text"
		value={String(value ?? '')}
		placeholder="7 días"
		{disabled}
		oninput={(e) => onChange('duracion', e.currentTarget.value)}
		class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink placeholder:text-ink-subtle outline-none transition-colors"
	/>
{/snippet}

{#snippet cantidadCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<input
		type="number"
		value={Number(value ?? 0)}
		min="0"
		{disabled}
		oninput={(e) => onChange('cantidad', Number(e.currentTarget.value))}
		class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink text-center tabular-nums outline-none transition-colors"
	/>
{/snippet}

{#snippet indicacionesCell(value: PrescriptionItem[keyof PrescriptionItem], _row: PrescriptionItem, _index: number, onChange: (key: keyof PrescriptionItem, value: PrescriptionItem[keyof PrescriptionItem]) => void)}
	<input
		type="text"
		value={String(value ?? '')}
		placeholder="Instrucciones..."
		{disabled}
		oninput={(e) => onChange('indicaciones', e.currentTarget.value)}
		class="w-full px-2 py-1 text-sm bg-transparent border border-transparent hover:border-border focus:border-border-strong focus:ring-1 focus:ring-border-subtle rounded text-ink placeholder:text-ink-subtle outline-none transition-colors"
	/>
{/snippet}

<!-- Component markup -->

<div class="bg-surface rounded-xl border border-border/60 overflow-hidden {className}">
	<!-- Header -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-5 py-3.5
			cursor-pointer hover:bg-canvas-subtle/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<div class="flex items-center gap-2.5">
			<svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
			</svg>
			<h3 class="text-sm font-semibold text-ink">Receta Médica</h3>
			{#if items.length > 0}
				<span class="text-xs text-ink-subtle bg-canvas-subtle px-1.5 py-0.5 rounded-full">
					{items.length} medicamento{items.length !== 1 ? 's' : ''}
				</span>
			{/if}
		</div>

		<svg
			class="w-4 h-4 text-ink-muted transition-transform duration-200 {collapsed ? '' : 'rotate-180'}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	<!-- Content -->
	{#if !collapsed}
		<div class="px-5 pb-5 border-t border-border/50">
			<!-- Agregar medicamento via MedicationSelector o texto libre -->
			{#if !disabled && medicationOptions.length > 0}
				<div class="pt-4 pb-3 space-y-2">
					<p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">Agregar medicamento</p>
					<div class="flex gap-2">
						<div class="flex-1">
							<MedicationSelector
								options={medicationOptions}
								selected={null}
								onSelect={(med) => addFromInventory(med)}
								onClear={() => {}}
								placeholder="Buscar en inventario del hospital..."
							/>
						</div>
					</div>
					{#if medSearch.trim()}
						<button
							type="button"
							class="text-xs text-amber-600 dark:text-amber-400 hover:underline"
							onclick={addExternal}
						>
							+ Agregar "{medSearch}" como medicamento externo
						</button>
					{/if}
					<p class="text-xs text-ink-subtle">
						<span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-viking-500"></span> Inventario hospital</span>
						<span class="ml-3 inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Farmacia externa</span>
					</p>
				</div>
			{/if}

			<div class="pt-2">
				<EditableTable
					{columns}
					data={items}
					{onchange}
					createRow={createPrescriptionItem}
					addLabel={medicationOptions.length > 0 ? 'Agregar medicamento externo' : 'Agregar medicamento'}
					showRowNumbers={true}
					{disabled}
				/>

				<!-- Emitir receta formal inline -->
				{#if onEmitRecipe && items.length > 0 && !disabled}
					<div class="mt-4 pt-3 border-t border-border/40">
						{#if recipeEmitted}
							<p class="text-sm text-sage-700 dark:text-sage-300 flex items-center gap-2">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" /></svg>
								Receta emitida correctamente
							</p>
						{:else}
							<Button
								variant="soft"
								size="md"
								isLoading={emitting}
								onclick={() => onEmitRecipe(items)}
							>
								<span class="flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
									</svg>
									Emitir receta formal
								</span>
							</Button>
							<p class="text-xs text-ink-muted mt-1">Genera una receta con número oficial para despacho en farmacia.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
