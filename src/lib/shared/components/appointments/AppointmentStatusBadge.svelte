<script lang="ts">
	import type { CitaEstado } from '$shared/types/appointments.js';

	interface Props {
		status: CitaEstado;
		class?: string;
	}

	let { status, class: className = '' }: Props = $props();

	// Mapeo de estado a clases semánticas del design system
	const styleMap: Record<CitaEstado, string> = {
		pendiente:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
		confirmada:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		atendida:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
		cancelada:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		no_asistio:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
	};

	const labelMap: Record<CitaEstado, string> = {
		pendiente:   'Pendiente',
		confirmada:  'Confirmada',
		atendida:    'Atendida',
		cancelada:   'Cancelada',
		no_asistio:  'No asistió'
	};
</script>

<span
	class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {styleMap[status]} {className}"
>
	{labelMap[status]}
</span>
