<script lang="ts">
	import type { MedicationFilters, MedicationStatus } from '$shared/types/inventory.js';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Button from '$shared/components/button/Button.svelte';

	interface Props {
		value: MedicationFilters;
		onchange: (filters: MedicationFilters) => void;
		class?: string;
	}

	let { value, onchange, class: className = '' }: Props = $props();

	// Estado local — sincronizado con el prop de entrada
	let search = $state(value.search ?? '');
	let status = $state<MedicationStatus | ''>(value.status ?? '');

	const statusOptions = [
		{ value: '',             label: 'Todos los estados' },
		{ value: 'active',       label: 'Activo' },
		{ value: 'discontinued', label: 'Descontinuado' },
		{ value: 'pending',      label: 'Pendiente' }
	];

	// Debounce para el campo de búsqueda con cleanup en $effect
	$effect(() => {
		const currentSearch = search;
		const timer = setTimeout(() => {
			onchange({ ...value, search: currentSearch || undefined, page: 1 });
		}, 350);
		return () => clearTimeout(timer);
	});

	function handleStatusChange(v: string | number | undefined) {
		if (typeof v !== 'string') return;
		status = (v as MedicationStatus | '');
		onchange({ ...value, status: (v as MedicationStatus) || undefined, page: 1 });
	}

	function clear() {
		search = '';
		status = '';
		onchange({});
	}
</script>

<div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-end {className}">
	<div class="flex-1 min-w-44">
		<Input
			label="Buscar medicamento"
			type="search"
			placeholder="Nombre genérico o código..."
			bind:value={search}
		/>
	</div>

	<div class="w-full sm:w-48">
		<Select
			label="Estado"
			options={statusOptions}
			value={status}
			onchange={handleStatusChange}
		/>
	</div>

	<div class="flex gap-2 pb-0.5">
		<Button variant="ghost" size="sm" onclick={clear}>Limpiar</Button>
	</div>
</div>
