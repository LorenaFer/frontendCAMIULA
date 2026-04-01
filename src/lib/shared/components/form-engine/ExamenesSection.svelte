<script lang="ts">
	import Input from '$shared/components/input/Input.svelte';
	import Button from '$shared/components/button/Button.svelte';

	export interface ExamenSolicitado {
		nombre: string;
		indicaciones: string;
	}

	interface Props {
		items: ExamenSolicitado[];
		disabled?: boolean;
		onchange: (items: ExamenSolicitado[]) => void;
		class?: string;
	}

	let { items, disabled = false, onchange, class: className = '' }: Props = $props();

	let collapsed = $state(false);
	let searchQuery = $state('');

	const EXAMENES_COMUNES = [
		'Hematología completa', 'Glicemia', 'Urea y Creatinina',
		'Perfil lipídico', 'Ácido úrico', 'Examen de orina',
		'Perfil hepático', 'TSH / T3 / T4', 'Electrolitos séricos',
		'Pruebas de coagulación', 'VSG / PCR', 'HIV / VDRL',
		'RX Tórax PA', 'RX Columna', 'Eco abdominal',
		'Eco pélvico', 'Eco renal', 'Electrocardiograma',
		'Ecocardiograma', 'TAC cerebral', 'TAC abdominal',
		'Resonancia magnética', 'Espirometría', 'Audiometría'
	];

	const sugerencias = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return EXAMENES_COMUNES.slice(0, 8);
		return EXAMENES_COMUNES.filter((e) =>
			e.toLowerCase().includes(q) &&
			!items.some((i) => i.nombre === e)
		);
	});

	function addExamen(nombre: string) {
		onchange([...items, { nombre, indicaciones: '' }]);
		searchQuery = '';
	}

	function addCustom() {
		const nombre = searchQuery.trim();
		if (!nombre || items.some((i) => i.nombre === nombre)) return;
		onchange([...items, { nombre, indicaciones: '' }]);
		searchQuery = '';
	}

	function removeExamen(index: number) {
		onchange(items.filter((_, i) => i !== index));
	}

	function updateIndicaciones(index: number, value: string) {
		const updated = items.map((item, i) =>
			i === index ? { ...item, indicaciones: value } : item
		);
		onchange(updated);
	}
</script>

<div class="bg-surface rounded-xl border border-border/60 overflow-hidden {className}">
	<button
		type="button"
		class="w-full flex items-center justify-between px-5 py-3.5
			cursor-pointer hover:bg-canvas-subtle/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<div class="flex items-center gap-2.5">
			<svg class="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
			</svg>
			<h3 class="text-sm font-semibold text-ink">Exámenes Solicitados</h3>
			{#if items.length > 0}
				<span class="text-xs text-viking-600 font-medium">({items.length})</span>
			{/if}
		</div>
		<svg
			class="w-4 h-4 text-ink-muted transition-transform duration-200 {collapsed ? '' : 'rotate-180'}"
			fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
		</svg>
	</button>

	{#if !collapsed}
		<div class="px-5 pb-5 border-t border-border/50">
			<div class="pt-4 space-y-3">
				<!-- Exámenes ya agregados -->
				{#if items.length > 0}
					<div class="space-y-2">
						{#each items as item, i (i)}
							<div class="bg-canvas-subtle rounded-lg border border-border/60 p-3">
								<div class="flex items-start justify-between gap-2">
									<p class="text-sm font-medium text-ink">{item.nombre}</p>
									{#if !disabled}
										<button
											type="button"
											class="p-1 text-ink-subtle hover:text-red-500 rounded transition-colors shrink-0"
											onclick={() => removeExamen(i)}
											aria-label="Quitar examen"
										>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
											</svg>
										</button>
									{/if}
								</div>
								<Input
									label=""
									placeholder="Indicaciones (ej: ayuno 12h, urgente...)"
									value={item.indicaciones}
									{disabled}
									inputSize="sm"
									oninput={(e) => updateIndicaciones(i, e.currentTarget.value)}
									class="mt-1.5"
								/>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Agregar examen -->
				{#if !disabled}
					<div>
						<Input
							label="Agregar examen"
							placeholder="Buscar examen o escribir nombre..."
							bind:value={searchQuery}
							inputSize="sm"
						/>

						{#if searchQuery.trim() || items.length === 0}
							<div class="flex flex-wrap gap-1.5 mt-2">
								{#each sugerencias.slice(0, 8) as sug}
									<button
										type="button"
										class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/60
											text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
										onclick={() => addExamen(sug)}
									>
										+ {sug}
									</button>
								{/each}
								{#if searchQuery.trim() && !EXAMENES_COMUNES.includes(searchQuery.trim())}
									<button
										type="button"
										class="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-viking-300 dark:border-viking-700
											text-viking-600 dark:text-viking-400 hover:bg-viking-50 dark:hover:bg-viking-900/20 transition-colors"
										onclick={addCustom}
									>
										+ Agregar "{searchQuery.trim()}"
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				{#if items.length === 0 && disabled}
					<p class="text-sm text-ink-muted text-center py-2">No se solicitaron exámenes.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
