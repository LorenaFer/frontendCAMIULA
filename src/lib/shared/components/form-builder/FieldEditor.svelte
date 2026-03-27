<script lang="ts">
	import type { FormFieldSchema, FieldType } from '$shared/types/form-schema.js';
	import OptionsEditor from './OptionsEditor.svelte';

	interface Props {
		field: FormFieldSchema;
		isFirst: boolean;
		isLast: boolean;
		onupdate: (updates: Partial<FormFieldSchema>) => void;
		onremove: () => void;
		onmove: (direction: 'up' | 'down') => void;
	}

	let { field, isFirst, isLast, onupdate, onremove, onmove }: Props = $props();

	let expanded = $state(false);

	const typeLabels: Record<FieldType, string> = {
		text: 'Texto',
		textarea: 'Texto largo',
		number: 'Número',
		date: 'Fecha',
		time: 'Hora',
		select: 'Selección',
		combobox: 'Combobox',
		autocomplete: 'Autocompletar',
		checkbox: 'Casilla',
		checkbox_group: 'Casillas',
		radio: 'Radio',
		switch: 'Switch',
		table: 'Tabla',
		widget: 'Widget'
	};

	const needsOptions = $derived(
		field.type === 'select' || field.type === 'radio' || field.type === 'checkbox_group'
	);
</script>

<div class="border border-border rounded-lg overflow-hidden bg-surface transition-shadow {expanded ? 'shadow-[var(--shadow-1)]' : ''}">
	<!-- Collapsed header -->
	<div class="flex items-center gap-2 px-3 py-2">
		<!-- Reorder buttons -->
		<div class="flex flex-col -space-y-0.5">
			<button
				type="button"
				onclick={() => onmove('up')}
				disabled={isFirst}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
				</svg>
			</button>
			<button
				type="button"
				onclick={() => onmove('down')}
				disabled={isLast}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</button>
		</div>

		<!-- Label + Type badge -->
		<button
			type="button"
			class="flex-1 flex items-center gap-2 text-left min-w-0"
			onclick={() => (expanded = !expanded)}
		>
			<span class="text-sm text-ink truncate">{field.label || 'Sin etiqueta'}</span>
			<span class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-canvas-subtle text-ink-muted">
				{typeLabels[field.type] ?? field.type}
			</span>
			{#if field.validation?.required}
				<span class="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" title="Requerido"></span>
			{/if}
		</button>

		<!-- Delete -->
		<button
			type="button"
			onclick={onremove}
			class="p-1 text-ink-subtle hover:text-red-500 rounded transition-colors"
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
			</svg>
		</button>

		<!-- Expand toggle -->
		<button
			type="button"
			onclick={() => (expanded = !expanded)}
			class="p-1 text-ink-subtle hover:text-ink rounded transition-colors"
		>
			<svg class="w-3.5 h-3.5 transition-transform {expanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</button>
	</div>

	<!-- Expanded editor -->
	{#if expanded}
		<div class="px-3 pb-3 pt-1 border-t border-border/50 space-y-3">
			<!-- Row 1: Label + Key -->
			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1">Etiqueta</label>
					<input
						type="text"
						value={field.label}
						oninput={(e) => onupdate({ label: e.currentTarget.value })}
						class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
					/>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1">Clave (key)</label>
					<input
						type="text"
						value={field.key}
						oninput={(e) => onupdate({ key: e.currentTarget.value })}
						class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors font-mono text-xs"
					/>
				</div>
			</div>

			<!-- Row 2: Type + ColSpan -->
			<div class="grid grid-cols-2 gap-2">
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1">Tipo</label>
					<select
						value={field.type}
						onchange={(e) => onupdate({ type: e.currentTarget.value as FieldType })}
						class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
					>
						{#each Object.entries(typeLabels) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-xs font-medium text-ink-muted mb-1">Ancho (columnas)</label>
					<select
						value={String(field.colSpan ?? '12')}
						onchange={(e) => onupdate({ colSpan: Number(e.currentTarget.value) as FormFieldSchema['colSpan'] })}
						class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
					>
						<option value="12">Completo (12)</option>
						<option value="9">3/4 (9)</option>
						<option value="6">Mitad (6)</option>
						<option value="4">Tercio (4)</option>
						<option value="3">Cuarto (3)</option>
					</select>
				</div>
			</div>

			<!-- Placeholder -->
			<div>
				<label class="block text-xs font-medium text-ink-muted mb-1">Placeholder</label>
				<input
					type="text"
					value={field.placeholder ?? ''}
					oninput={(e) => onupdate({ placeholder: e.currentTarget.value })}
					class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
				/>
			</div>

			<!-- Unit (for text/number) -->
			{#if field.type === 'text' || field.type === 'number'}
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="block text-xs font-medium text-ink-muted mb-1">Unidad</label>
						<input
							type="text"
							value={field.unit ?? ''}
							placeholder="mmHg, kg, °C..."
							oninput={(e) => onupdate({ unit: e.currentTarget.value || undefined })}
							class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle outline-none focus:border-border-strong transition-colors"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium text-ink-muted mb-1">Hint</label>
						<input
							type="text"
							value={field.hint ?? ''}
							placeholder="Texto de ayuda..."
							oninput={(e) => onupdate({ hint: e.currentTarget.value || undefined })}
							class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle outline-none focus:border-border-strong transition-colors"
						/>
					</div>
				</div>
			{/if}

			<!-- Rows (for textarea) -->
			{#if field.type === 'textarea'}
				<div class="w-32">
					<label class="block text-xs font-medium text-ink-muted mb-1">Filas</label>
					<input
						type="number"
						value={field.rows ?? 3}
						min="1"
						max="20"
						oninput={(e) => onupdate({ rows: Number(e.currentTarget.value) })}
						class="w-full px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
					/>
				</div>
			{/if}

			<!-- Validation -->
			<div class="space-y-2">
				<label class="block text-xs font-medium text-ink-muted">Validación</label>
				<div class="flex items-center gap-4">
					<label class="flex items-center gap-1.5 text-sm text-ink">
						<input
							type="checkbox"
							checked={field.validation?.required ?? false}
							onchange={(e) => onupdate({ validation: { ...field.validation, required: e.currentTarget.checked } })}
							class="rounded border-border"
						/>
						Requerido
					</label>
				</div>
				{#if field.type === 'number'}
					<div class="grid grid-cols-2 gap-2">
						<div>
							<label class="block text-[11px] text-ink-muted mb-0.5">Mínimo</label>
							<input
								type="number"
								value={field.validation?.min ?? ''}
								oninput={(e) => onupdate({ validation: { ...field.validation, min: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })}
								class="w-full px-2 py-1 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
							/>
						</div>
						<div>
							<label class="block text-[11px] text-ink-muted mb-0.5">Máximo</label>
							<input
								type="number"
								value={field.validation?.max ?? ''}
								oninput={(e) => onupdate({ validation: { ...field.validation, max: e.currentTarget.value ? Number(e.currentTarget.value) : undefined } })}
								class="w-full px-2 py-1 text-sm rounded border border-border bg-surface-elevated text-ink outline-none focus:border-border-strong transition-colors"
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Options (for select, radio, checkbox_group) -->
			{#if needsOptions}
				<OptionsEditor
					options={field.options ?? []}
					onchange={(opts) => onupdate({ options: opts })}
				/>
			{/if}
		</div>
	{/if}
</div>
