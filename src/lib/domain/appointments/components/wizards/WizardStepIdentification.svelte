<script lang="ts">
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	interface Props {
		query: string;
		queryType: 'nhm' | 'cedula';
		loading: boolean;
		pacienteNoEncontrado: boolean;
		onQueryChange: (value: string) => void;
		onSubmit: () => void;
	}

	let {
		query = $bindable(),
		queryType,
		loading,
		pacienteNoEncontrado,
		onQueryChange,
		onSubmit
	}: Props = $props();
</script>

<div class="space-y-4">
	<p class="text-sm text-ink">Ingrese su cédula de identidad o número de historia médica.</p>

	<Input
		label="Cédula o NHM"
		placeholder="Ej: V-12345678 o 1001"
		bind:value={query}
		oninput={() => onQueryChange(query)}
		inputSize="lg"
	/>

	{#if query.trim()}
		<p class="text-xs text-ink-muted">
			Buscando como: <strong>{queryType === 'nhm' ? 'N° de Historia Médica' : 'Cédula de identidad'}</strong>
		</p>
	{/if}

	<Button variant="primary" fullWidth onclick={onSubmit} isLoading={loading}>
		Continuar
	</Button>

	{#if pacienteNoEncontrado}
		<div class="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
			<div class="flex items-start gap-2.5">
				<svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
				<div>
					<p class="text-sm font-semibold text-amber-800 dark:text-amber-200">Paciente no registrado</p>
					<p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
						No se encontró un paciente con la cédula o NHM ingresado. El paciente debe registrarse primero a través del portal.
					</p>
				</div>
			</div>
			<a
				href="/portal/registro"
				class="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-viking-600 text-white text-sm font-medium hover:bg-viking-700 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
				</svg>
				Ir al portal de registro
			</a>
		</div>
	{/if}
</div>
