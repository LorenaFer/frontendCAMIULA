<script lang="ts">
	import type { FieldOption } from '$domain/medical-records/form-schema.js';

	interface Props {
		options: FieldOption[];
		onchange: (options: FieldOption[]) => void;
	}

	let { options, onchange }: Props = $props();

	function addOption() {
		onchange([...options, { value: '', label: '' }]);
	}

	function removeOption(index: number) {
		onchange(options.filter((_, i) => i !== index));
	}

	function updateOption(index: number, field: 'value' | 'label', val: string) {
		const updated = options.map((opt, i) =>
			i === index ? { ...opt, [field]: val } : opt
		);
		// Auto-generate value from label if value is empty
		if (field === 'label' && !options[index].value) {
			updated[index].value = val
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');
		}
		onchange(updated);
	}
</script>

<div class="space-y-2">
	<label class="block text-xs font-medium text-ink-muted">Opciones</label>
	{#each options as opt, i}
		<div class="flex items-center gap-2">
			<input
				type="text"
				value={opt.label}
				placeholder="Etiqueta"
				oninput={(e) => updateOption(i, 'label', e.currentTarget.value)}
				class="flex-1 px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle outline-none focus:border-border-strong transition-colors"
			/>
			<input
				type="text"
				value={opt.value}
				placeholder="Valor"
				oninput={(e) => updateOption(i, 'value', e.currentTarget.value)}
				class="w-28 px-2 py-1.5 text-sm rounded border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle outline-none focus:border-border-strong transition-colors font-mono text-xs"
			/>
			<button
				type="button"
				onclick={() => removeOption(i)}
				class="p-1 text-ink-subtle hover:text-red-500 rounded transition-colors"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
	<button
		type="button"
		onclick={addOption}
		class="text-xs text-viking-600 hover:text-viking-700 font-medium transition-colors"
	>
		+ Agregar opción
	</button>
</div>
