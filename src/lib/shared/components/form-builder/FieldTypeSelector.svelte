<script lang="ts">
	import type { FieldType } from '$shared/types/form-schema.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';

	interface Props {
		open: boolean;
		onselect: (type: FieldType) => void;
		onclose: () => void;
	}

	let { open, onselect, onclose }: Props = $props();

	const fieldTypes: { type: FieldType; label: string; description: string; icon: string }[] = [
		{ type: 'text', label: 'Texto corto', description: 'Una línea de texto', icon: 'T' },
		{ type: 'textarea', label: 'Texto largo', description: 'Múltiples líneas', icon: '¶' },
		{ type: 'number', label: 'Número', description: 'Valor numérico', icon: '#' },
		{ type: 'date', label: 'Fecha', description: 'Selector de fecha', icon: '📅' },
		{ type: 'time', label: 'Hora', description: 'Selector de hora', icon: '⏰' },
		{ type: 'select', label: 'Selección', description: 'Lista desplegable', icon: '▼' },
		{ type: 'radio', label: 'Radio', description: 'Opción única', icon: '◉' },
		{ type: 'checkbox', label: 'Casilla', description: 'Sí / No', icon: '☑' },
		{ type: 'checkbox_group', label: 'Casillas múltiples', description: 'Varias opciones', icon: '☐' },
		{ type: 'switch', label: 'Switch', description: 'Encendido / Apagado', icon: '⊘' }
	];

	function handleSelect(type: FieldType) {
		onselect(type);
		onclose();
	}
</script>

<Dialog {open} onClose={onclose} size="md">
	<DialogHeader>
		<h3 class="text-sm font-semibold text-ink">Seleccionar tipo de campo</h3>
	</DialogHeader>

	<DialogBody>
		<div class="grid grid-cols-2 gap-2">
			{#each fieldTypes as ft}
				<button
					onclick={() => handleSelect(ft.type)}
					class="flex items-center gap-3 p-3 rounded-lg border border-border/60
						hover:border-viking-300 dark:hover:border-viking-700 hover:bg-viking-50 dark:hover:bg-viking-900/20
						focus-visible:ring-2 focus-visible:ring-viking-500/40 focus-visible:ring-offset-1
						transition-all text-left"
				>
					<span class="w-8 h-8 rounded-lg bg-canvas-subtle flex items-center justify-center text-sm font-mono text-ink-muted shrink-0">
						{ft.icon}
					</span>
					<div class="min-w-0">
						<div class="text-sm font-medium text-ink">{ft.label}</div>
						<div class="text-[11px] text-ink-muted truncate">{ft.description}</div>
					</div>
				</button>
			{/each}
		</div>
	</DialogBody>
</Dialog>
