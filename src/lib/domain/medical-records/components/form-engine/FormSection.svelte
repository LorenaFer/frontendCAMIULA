<script lang="ts">
	import type { FormSection as FormSectionType } from '$domain/medical-records/form-schema.js';
	import type { FormStore } from './FormStore.svelte.js';
	import { evaluateConditions } from './utils.js';
	import FormFieldGroup from './FormFieldGroup.svelte';

	interface Props {
		section: FormSectionType;
		store: FormStore;
		formData: Record<string, unknown>;
		disabled?: boolean;
	}

	let { section, store, formData, disabled = false }: Props = $props();

	let collapsed = $state(section.defaultCollapsed ?? false);

	function toggleCollapse() {
		if (section.collapsible) {
			collapsed = !collapsed;
		}
	}
</script>

{#if evaluateConditions(section.conditions, formData)}
	<div class="bg-surface rounded-xl border border-border overflow-hidden">
		<!-- Header -->
		<button
			type="button"
			class="w-full flex items-center justify-between px-5 py-3.5
				{section.collapsible ? 'cursor-pointer hover:bg-canvas-subtle/50' : 'cursor-default'}
				transition-colors"
			onclick={toggleCollapse}
			disabled={!section.collapsible}
		>
			<div class="flex items-center gap-2.5">
				<h3 class="text-sm font-semibold text-ink">{section.title}</h3>
				{#if section.description}
					<span class="text-xs text-ink-subtle hidden sm:inline">— {section.description}</span>
				{/if}
			</div>

			{#if section.collapsible}
				<svg
					class="w-4 h-4 text-ink-muted transition-transform duration-200 {collapsed
						? ''
						: 'rotate-180'}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			{/if}
		</button>

		<!-- Content -->
		{#if !collapsed}
			<div class="px-5 pb-5 space-y-5 border-t border-border/50">
				<div class="pt-4"></div>
				{#each section.groups as group (group.id)}
					<FormFieldGroup {group} {store} {formData} {disabled} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
