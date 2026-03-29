<script lang="ts">
	import type { MedicationStatus } from '$shared/types/inventory.js';

	interface Props {
		status: MedicationStatus;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	const styleMap: Record<MedicationStatus, string> = {
		active:       'bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300',
		discontinued: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		pending:      'bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300'
	};

	const labelMap: Record<MedicationStatus, string> = {
		active:       'Activo',
		discontinued: 'Descontinuado',
		pending:      'Pendiente'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {styleMap[status]} {className}"
>
	{labelMap[status]}
</span>
