<script lang="ts">
	import type { FormBuilderStore } from './FormBuilderStore.svelte.js';
	import SectionEditor from './SectionEditor.svelte';

	interface Props {
		store: FormBuilderStore;
	}

	let { store }: Props = $props();
</script>

<div class="space-y-4">
	<!-- Schema info bar -->
	<div class="flex items-center gap-3 text-xs text-ink-muted">
		<span>{store.sectionCount} seccione{store.sectionCount !== 1 ? 's' : ''}</span>
		<span class="text-border">|</span>
		<span>{store.fieldCount} campo{store.fieldCount !== 1 ? 's' : ''}</span>
		<span class="text-border">|</span>
		<span>v{store.schema.version}</span>
	</div>

	<!-- Sections -->
	{#each store.schema.sections as section, i (section.id)}
		<SectionEditor
			{section}
			isFirst={i === 0}
			isLast={i === store.schema.sections.length - 1}
			{store}
		/>
	{/each}

	<!-- Add section -->
	<button
		type="button"
		onclick={() => store.addSection()}
		class="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-ink-muted
			hover:text-viking-600 hover:bg-viking-50 dark:hover:bg-viking-900/20 border-2 border-dashed border-border
			hover:border-viking-300 dark:hover:border-viking-700 rounded-xl transition-all"
	>
		<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
		Agregar sección
	</button>
</div>
