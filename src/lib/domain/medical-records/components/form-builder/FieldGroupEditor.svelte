<script lang="ts">
	import type { FormFieldGroup, FormFieldSchema, FieldType } from '$domain/medical-records/form-schema.js';
	import type { FormBuilderStore } from './FormBuilderStore.svelte.js';
	import FieldEditor from './FieldEditor.svelte';
	import FieldTypeSelector from './FieldTypeSelector.svelte';

	interface Props {
		group: FormFieldGroup;
		sectionId: string;
		isFirst: boolean;
		isLast: boolean;
		store: FormBuilderStore;
	}

	let { group, sectionId, isFirst, isLast, store }: Props = $props();

	let showTypeSelector = $state(false);
</script>

<div class="space-y-2">
	<!-- Group header -->
	<div class="flex items-center gap-2">
		<!-- Reorder -->
		<div class="flex flex-col -space-y-0.5">
			<button
				type="button"
				onclick={() => store.moveGroup(sectionId, group.id, 'up')}
				disabled={isFirst}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
				</svg>
			</button>
			<button
				type="button"
				onclick={() => store.moveGroup(sectionId, group.id, 'down')}
				disabled={isLast}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</button>
		</div>

		<!-- Group label input -->
		<input
			type="text"
			value={group.label ?? ''}
			placeholder="Nombre del grupo (opcional)"
			oninput={(e) => store.updateGroup(sectionId, group.id, { label: e.currentTarget.value || undefined })}
			class="flex-1 px-2 py-1 text-xs rounded border border-transparent hover:border-border focus:border-border-strong bg-transparent text-ink-muted outline-none transition-colors"
		/>

		<!-- Columns select -->
		<select
			value={String(group.columns ?? '')}
			onchange={(e) => store.updateGroup(sectionId, group.id, { columns: e.currentTarget.value ? Number(e.currentTarget.value) as FormFieldGroup['columns'] : undefined })}
			class="px-1.5 py-1 text-xs rounded border border-border bg-surface-elevated text-ink-muted outline-none transition-colors"
			title="Columnas del grid"
		>
			<option value="">Auto</option>
			<option value="1">1 col</option>
			<option value="2">2 cols</option>
			<option value="3">3 cols</option>
			<option value="4">4 cols</option>
			<option value="6">6 cols</option>
		</select>

		<!-- Delete group -->
		<button
			type="button"
			onclick={() => store.removeGroup(sectionId, group.id)}
			class="p-1 text-ink-subtle hover:text-red-500 rounded transition-colors"
			title="Eliminar grupo"
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
			</svg>
		</button>
	</div>

	<!-- Fields -->
	<div class="space-y-1.5 pl-4">
		{#each group.fields as field, i (field.key)}
			<FieldEditor
				{field}
				isFirst={i === 0}
				isLast={i === group.fields.length - 1}
				onupdate={(updates) => store.updateField(sectionId, group.id, field.key, updates)}
				onremove={() => store.removeField(sectionId, group.id, field.key)}
				onmove={(dir) => store.moveField(sectionId, group.id, field.key, dir)}
			/>
		{/each}

		<!-- Add field -->
		<button
			type="button"
			onclick={() => (showTypeSelector = true)}
			class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-muted
				hover:text-viking-600 hover:bg-viking-50 dark:hover:bg-viking-900/20 border border-dashed border-border
				hover:border-viking-300 dark:hover:border-viking-700 rounded-lg transition-all"
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			Agregar campo
		</button>
	</div>
</div>

<FieldTypeSelector
	open={showTypeSelector}
	onselect={(type) => store.addField(sectionId, group.id, type)}
	onclose={() => (showTypeSelector = false)}
/>
