<script lang="ts">
	import type { Snippet } from 'svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { getMultiStepDialogContext } from './multiStepDialogContext.js';

	let {
		children,
		backLabel = 'Back',
		nextLabel = 'Continue',
		completeLabel = 'Complete',
		hideBack = false,
		nextDisabled = false,
		isSubmitting = false,
		onNext,
		class: className = ''
	}: {
		children?: Snippet;
		backLabel?: string;
		nextLabel?: string;
		completeLabel?: string;
		hideBack?: boolean;
		nextDisabled?: boolean;
		isSubmitting?: boolean;
		onNext?: () => boolean | void | Promise<boolean | void>;
		class?: string;
	} = $props();

	const ctx = getMultiStepDialogContext();

	async function handleNext() {
		if (onNext) {
			const result = await onNext();
			if (result === false) return;
		}
		ctx.nextStep();
	}
</script>

{#if children}
	<DialogFooter class={className}>
		{@render children()}
	</DialogFooter>
{:else}
	<DialogFooter class={className}>
		<div class="flex items-center justify-between w-full">
			<div>
				{#if !hideBack && ctx.canGoBack}
					<button
						type="button"
						onclick={ctx.prevStep}
						disabled={isSubmitting}
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink hover:text-ink hover:bg-canvas-subtle rounded-lg transition-colors disabled:opacity-50"
					>
						<svg
							class="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/>
						</svg>
						{backLabel}
					</button>
				{/if}
			</div>
			<button
				type="button"
				onclick={handleNext}
				disabled={nextDisabled || isSubmitting}
				class="
					inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
					bg-viking-500 text-white hover:bg-viking-600
					disabled:opacity-50 disabled:cursor-not-allowed
				"
			>
				{#if isSubmitting}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					Processing...
				{:else}
					{ctx.isLastStep ? completeLabel : nextLabel}
					{#if !ctx.isLastStep}
						<svg
							class="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/>
						</svg>
					{/if}
				{/if}
			</button>
		</div>
	</DialogFooter>
{/if}
