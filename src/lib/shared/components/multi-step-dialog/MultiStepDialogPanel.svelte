<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getMultiStepDialogContext } from './multiStepDialogContext.js';

	let {
		step,
		children,
		class: className = ''
	}: {
		step: number;
		children: Snippet;
		class?: string;
	} = $props();

	const ctx = getMultiStepDialogContext();
</script>

{#if step === ctx.currentStep}
	<div
		class="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-200 {className}"
	>
		{@render children()}
	</div>
{/if}
