<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { DispatchValidation } from '$domain/inventory/types.js';
	import Card from '$shared/components/card/Card.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import LimitProgressBar from '$domain/inventory/components/widgets/LimitProgressBar.svelte';
	import { toastSuccess, toastError, toastInfo } from '$shared/components/toast/toast.svelte.js';

	export type ActivePrescription = { id: string; prescription_number: string; patient_name?: string };

	interface Props {
		activeValidation: DispatchValidation | null;
		activePrescription: ActivePrescription | null;
		onRequestConfirm: () => void;
		/** Called after the dispatch submission resolves (success or failure) */
		onDispatchSettled?: () => void;
		/** Bindable ref for parent to programmatically submit the dispatch form */
		submitDispatch?: () => void;
		/** Bindable flag indicating whether the dispatch action is in flight */
		dispatching?: boolean;
	}

	let {
		activeValidation,
		activePrescription,
		onRequestConfirm,
		onDispatchSettled,
		submitDispatch = $bindable(() => {}),
		dispatching = $bindable(false)
	}: Props = $props();

	let searchNumber = $state('');
	let validating = $state(false);
	let dispatchFormRef = $state<HTMLFormElement | null>(null);

	// Expose submit handler to parent via bindable
	$effect(() => {
		submitDispatch = () => { dispatchFormRef?.requestSubmit(); };
	});
</script>

<Card padding="md">
	<h2 class="text-sm font-semibold text-ink mb-3">Validar receta</h2>

	<form
		method="POST"
		action="?/validarDespacho"
		use:enhance={() => {
			validating = true;
			return async ({ result, update }) => {
				validating = false;
				await update({ reset: false });
				if (result.type === 'success') {
					toastInfo('Receta validada', 'La receta fue validada correctamente.');
				} else if (result.type === 'failure') {
					toastError('Error de validación', (result.data as { error?: string })?.error ?? 'No se pudo validar la receta.');
				}
			};
		}}
		class="flex gap-2"
	>
		<input
			name="prescription_number"
			type="text"
			placeholder="Número de receta (ej: RX-001)"
			bind:value={searchNumber}
			class="flex-1 h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
			       hover:border-border-strong focus:outline-none focus:border-viking-400
			       focus:ring-2 focus:ring-viking-100/60"
		/>
		<Button type="submit" variant="primary" size="md" isLoading={validating}>
			Validar
		</Button>
	</form>

	<!-- Resultado de validación -->
	{#if activeValidation && activePrescription}
		<div class="mt-4 space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-ink">
						Receta <span class="font-mono">{activePrescription.prescription_number}</span>
					</p>
					{#if activePrescription.patient_name}
						<p class="text-sm text-ink-muted">Paciente: {activePrescription.patient_name}</p>
					{/if}
				</div>
				{#if activeValidation.can_dispatch}
					<Badge variant="success" style="soft" size="sm" dot>Puede despacharse</Badge>
				{:else}
					<Badge variant="danger" style="soft" size="sm" dot>Bloqueado</Badge>
				{/if}
			</div>

			<!-- Ítems de la receta con estado de límite -->
			<ul class="space-y-2">
				{#each activeValidation.items as item}
					<li class="bg-canvas-subtle/60 border border-border/60 rounded-lg p-3 space-y-2">
						<div class="flex items-start justify-between gap-2">
							<div>
								<p class="text-sm font-medium text-ink">{item.generic_name}</p>
								<p class="text-sm text-ink-muted">
									Prescrito: {item.quantity_prescribed} · Disponible: {item.quantity_available}
								</p>
							</div>
							{#if !item.can_dispatch}
								<span class="text-xs text-red-600 dark:text-red-400 font-medium shrink-0">{item.block_reason}</span>
							{/if}
						</div>

						{#if item.monthly_limit}
							<LimitProgressBar
								used={item.monthly_used}
								limit={item.monthly_limit}
								unit="uds"
								medication_name="Límite mensual"
							/>
							{#if item.has_exception}
								<p class="text-xs text-viking-600 dark:text-viking-400">Excepción activa aplicada</p>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>

			<!-- Botón de despacho -->
			{#if activeValidation.can_dispatch}
				<form
					bind:this={dispatchFormRef}
					method="POST"
					action="?/ejecutarDespacho"
					use:enhance={() => {
						dispatching = true;
						return async ({ result, update }) => {
							dispatching = false;
							onDispatchSettled?.();
							await update();
							if (result.type === 'success') {
								toastSuccess('Despacho realizado', `Se despacharon los medicamentos de la receta ${activePrescription?.prescription_number ?? ''}.`);
							} else if (result.type === 'failure') {
								toastError('Error al despachar', (result.data as { error?: string })?.error ?? 'No se pudo ejecutar el despacho.');
							}
							await invalidateAll();
						};
					}}
				>
					<input type="hidden" name="prescription_id" value={activeValidation.prescription_id} />
					<Button type="button" variant="primary" size="md" onclick={onRequestConfirm} class="w-full sm:w-auto">
						Ejecutar despacho
					</Button>
				</form>
			{/if}

		</div>
	{/if}
</Card>
