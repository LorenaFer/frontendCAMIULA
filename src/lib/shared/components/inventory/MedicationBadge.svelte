<script lang="ts">
	import type { MedicationStatus } from '$shared/types/inventory.js';

	interface Props {
		status: MedicationStatus;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	const styleMap: Record<MedicationStatus, string> = {
		active:       'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
		discontinued: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		pending:      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
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
