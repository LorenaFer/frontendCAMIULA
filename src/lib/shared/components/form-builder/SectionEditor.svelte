<script lang="ts">
	import type { FormSection } from '$shared/types/form-schema.js';
	import type { FormBuilderStore } from './FormBuilderStore.svelte.js';
	import FieldGroupEditor from './FieldGroupEditor.svelte';

	interface Props {
		section: FormSection;
		isFirst: boolean;
		isLast: boolean;
		store: FormBuilderStore;
	}

	let { section, isFirst, isLast, store }: Props = $props();

	let collapsed = $state(false);
</script>

<div class="bg-surface rounded-xl border border-border overflow-hidden">
	<!-- Section header -->
	<div class="flex items-center gap-2 px-4 py-3 bg-canvas-subtle/50">
		<!-- Reorder -->
		<div class="flex flex-col -space-y-0.5">
			<button
				type="button"
				onclick={() => store.moveSection(section.id, 'up')}
				disabled={isFirst}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
				</svg>
			</button>
			<button
				type="button"
				onclick={() => store.moveSection(section.id, 'down')}
				disabled={isLast}
				class="p-0.5 text-ink-subtle hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</button>
		</div>

		<!-- Title input -->
		<input
			type="text"
			value={section.title}
			placeholder="Título de la sección"
			oninput={(e) => store.updateSection(section.id, { title: e.currentTarget.value })}
			class="flex-1 px-2 py-1 text-sm font-semibold rounded border border-transparent hover:border-border
				focus:border-border-strong bg-transparent text-ink outline-none transition-colors"
		/>

		<!-- Field count badge -->
		<span class="text-[11px] text-ink-muted bg-canvas-subtle px-1.5 py-0.5 rounded-full shrink-0">
			{section.groups.reduce((t, g) => t + g.fields.length, 0)} campos
		</span>

		<!-- Collapsible toggle -->
		<label class="flex items-center gap-1 text-[11px] text-ink-muted shrink-0" title="Sección colapsable">
			<input
				type="checkbox"
				checked={section.collapsible ?? false}
				onchange={(e) => store.updateSection(section.id, { collapsible: e.currentTarget.checked })}
				class="rounded border-border w-3 h-3"
			/>
			Colapsable
		</label>

		<!-- Delete section -->
		<button
			type="button"
			onclick={() => { if (confirm(`¿Eliminar la sección "${section.title}"?`)) store.removeSection(section.id); }}
			class="p-1.5 text-ink-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
			title="Eliminar sección"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
			</svg>
		</button>

		<!-- Collapse toggle -->
		<button
			type="button"
			onclick={() => (collapsed = !collapsed)}
			class="p-1.5 text-ink-subtle hover:text-ink rounded-lg transition-colors"
		>
			<svg class="w-4 h-4 transition-transform {collapsed ? '' : 'rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
			</svg>
		</button>
	</div>

	<!-- Section description -->
	{#if !collapsed}
		<div class="px-4 pt-3">
			<input
				type="text"
				value={section.description ?? ''}
				placeholder="Descripción de la sección (opcional)"
				oninput={(e) => store.updateSection(section.id, { description: e.currentTarget.value || undefined })}
				class="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-border
					focus:border-border-strong bg-transparent text-ink-muted outline-none transition-colors"
			/>
		</div>

		<!-- Groups -->
		<div class="p-4 space-y-4">
			{#each section.groups as group, i (group.id)}
				{#if i > 0}
					<div class="border-t border-border/50"></div>
				{/if}
				<FieldGroupEditor
					{group}
					sectionId={section.id}
					isFirst={i === 0}
					isLast={i === section.groups.length - 1}
					{store}
				/>
			{/each}

			<!-- Add group -->
			<button
				type="button"
				onclick={() => store.addGroup(section.id)}
				class="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-ink-muted
					hover:text-viking-600 hover:bg-viking-50 dark:hover:bg-viking-900/20 border border-dashed border-border
					hover:border-viking-300 dark:hover:border-viking-700 rounded-lg transition-all"
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Agregar grupo de campos
			</button>
		</div>
	{/if}
</div>
