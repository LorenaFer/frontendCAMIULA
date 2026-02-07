import { getContext, setContext } from 'svelte';

const MULTI_STEP_DIALOG_KEY = 'multi-step-dialog';

export interface MultiStepDialogContextValue {
	currentStep: number;
	totalSteps: number;
	goToStep: (step: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	isFirstStep: boolean;
	isLastStep: boolean;
	canGoBack: boolean;
}

export function setMultiStepDialogContext(value: MultiStepDialogContextValue) {
	setContext(MULTI_STEP_DIALOG_KEY, value);
}

export function getMultiStepDialogContext(): MultiStepDialogContextValue {
	return getContext<MultiStepDialogContextValue>(MULTI_STEP_DIALOG_KEY);
}
