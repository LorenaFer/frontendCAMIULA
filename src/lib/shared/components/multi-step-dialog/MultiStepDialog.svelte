<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import Stepper from '$shared/components/stepper/Stepper.svelte';
	import type { Step } from '$shared/components/stepper/types.js';
	import { setMultiStepDialogContext } from './multi-step-dialog-context.js';

	type StepperVariant = 'default' | 'compact' | 'dots' | 'none';

	let {
		open,
		onClose,
		steps,
		children,
		initialStep = 0,
		stepperVariant = 'default',
		allowStepClick = true,
		onStepChange,
		onComplete,
		size = 'md',
		persistent = false,
		class: className = ''
	}: {
		open: boolean;
		onClose: () => void;
		steps: Step[];
		children: Snippet;
		initialStep?: number;
		stepperVariant?: StepperVariant;
		allowStepClick?: boolean;
		onStepChange?: (step: number) => void;
		onComplete?: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		persistent?: boolean;
		class?: string;
	} = $props();

	let currentStep = $state(initialStep);

	function goToStep(step: number) {
		if (step >= 0 && step < steps.length) {
			currentStep = step;
			onStepChange?.(step);
		}
	}

	function nextStep() {
		if (currentStep < steps.length - 1) {
			goToStep(currentStep + 1);
		} else {
			onComplete?.();
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			goToStep(currentStep - 1);
		}
	}

	function handleStepClick(stepIndex: number) {
		if (allowStepClick && stepIndex < currentStep) {
			goToStep(stepIndex);
		}
	}

	function handleClose() {
		onClose();
		// Reset after animation completes
		setTimeout(() => (currentStep = initialStep), 200);
	}

	// Provide reactive context using getter pattern for Svelte 5
	setMultiStepDialogContext({
		get currentStep() {
			return currentStep;
		},
		get totalSteps() {
			return steps.length;
		},
		goToStep,
		nextStep,
		prevStep,
		get isFirstStep() {
			return currentStep === 0;
		},
		get isLastStep() {
			return currentStep === steps.length - 1;
		},
		get canGoBack() {
			return currentStep > 0;
		}
	});
</script>

<Dialog {open} onClose={handleClose} {size} {persistent} class={className}>
	{#if stepperVariant !== 'none'}
		<div class="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
			<Stepper
				{steps}
				{currentStep}
				variant={stepperVariant}
				onStepClick={allowStepClick ? handleStepClick : undefined}
			/>
		</div>
	{/if}

	{@render children()}
</Dialog>
