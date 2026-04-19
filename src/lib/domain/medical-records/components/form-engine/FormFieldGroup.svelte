<script lang="ts">
	import type { FormFieldGroup as FormFieldGroupType } from '$domain/medical-records/form-schema.js';
	import type { FormStore } from './form-store.svelte.js';
	import { evaluateConditions } from './field-helpers.js';
	import { getNestedValue } from './field-helpers.js';
	import FormField from './FormField.svelte';

	interface Props {
		group: FormFieldGroupType;
		store: FormStore;
		formData: Record<string, unknown>;
		disabled?: boolean;
	}

	let { group, store, formData, disabled = false }: Props = $props();

	// Mapeo de colSpan a clases de Tailwind grid
	const colSpanClasses: Record<number, string> = {
		1: 'col-span-1',
		2: 'col-span-2',
		3: 'col-span-3',
		4: 'col-span-4',
		5: 'col-span-5',
		6: 'col-span-6',
		7: 'col-span-7',
		8: 'col-span-8',
		9: 'col-span-9',
		10: 'col-span-10',
		11: 'col-span-11',
		12: 'col-span-12'
	};

	/** colSpan por defecto según el tipo de campo */
	function getDefaultColSpan(type: string): number {
		switch (type) {
			case 'textarea':
				return 12;
			case 'checkbox':
			case 'switch':
				return 4;
			case 'checkbox_group':
			case 'radio':
				return 12;
			case 'widget':
			case 'table':
				return 12;
			default:
				return 4;
		}
	}
</script>

{#if evaluateConditions(group.conditions, formData)}
	<div>
		{#if group.label}
			<p class="text-sm font-medium text-ink-muted mb-2">{group.label}</p>
		{/if}
		{#if group.description}
			<p class="text-xs text-ink-subtle mb-3">{group.description}</p>
		{/if}

		<div class="grid grid-cols-12 gap-3 sm:gap-4">
			{#each group.fields as field (field.key)}
				{#if evaluateConditions(field.conditions, formData)}
					{@const span = field.colSpan ?? getDefaultColSpan(field.type)}
					<div class="{colSpanClasses[span]} max-sm:col-span-12">
						<FormField
							{field}
							value={getNestedValue(formData, field.key)}
							error={store.getFieldError(field.key)}
							{disabled}
							onchange={(v) => store.setValue(field.key, v, field)}
						/>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}
