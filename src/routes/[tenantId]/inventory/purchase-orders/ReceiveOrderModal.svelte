<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PurchaseOrder } from '$shared/types/inventory.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';

	let {
		order,
		onClose
	}: {
		order: PurchaseOrder;
		onClose: () => void;
	} = $props();

	interface ReceiveDraft {
		purchase_order_item_id: string;
		medication_name: string;
		unit_measure: string;
		quantity_ordered: number;
		quantity_received: number;
		lot_number: string;
		expiration_date: string;
		unit_cost: number;
	}

	let submitting = $state(false);

	let drafts = $state<ReceiveDraft[]>(
		order.items.map((item) => ({
			purchase_order_item_id: item.id,
			medication_name: item.medication.generic_name,
			unit_measure: item.medication.unit_measure,
			quantity_ordered: item.quantity_ordered,
			quantity_received: item.quantity_ordered - item.quantity_received,
			lot_number: '',
			expiration_date: '',
			unit_cost: item.unit_cost
		}))
	);

	const serializedItems = $derived(
		JSON.stringify(
			drafts.map((d) => ({
				purchase_order_item_id: d.purchase_order_item_id,
				quantity_received: d.quantity_received,
				lot_number: d.lot_number,
				expiration_date: d.expiration_date,
				unit_cost: d.unit_cost
			}))
		)
	);

	const isValid = $derived(
		drafts.every(
			(d) =>
				d.lot_number.trim().length > 0 &&
				d.expiration_date.length > 0 &&
				d.quantity_received > 0
		)
	);
</script>

<Dialog open={true} {onClose} size="lg">
	<DialogHeader>
		<p class="text-sm text-ink-muted font-normal">Orden {order.order_number}</p>
		<h2 class="text-base font-semibold text-ink">Registrar Recepción</h2>
	</DialogHeader>

	<form
		method="POST"
		action="?/recibirOrden"
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				submitting = false;
				await update();
				if (result.type === 'success') {
					await invalidateAll();
					onClose();
				}
			};
		}}
	>
		<input type="hidden" name="order_id" value={order.id} />
		<input type="hidden" name="items" value={serializedItems} />

		<DialogBody>
			<div class="space-y-4">
				{#if drafts.length === 0}
					<p class="text-sm text-ink-muted text-center py-4">Esta orden no tiene ítems registrados.</p>
				{:else}
					{#each drafts as draft, i (draft.purchase_order_item_id)}
						<div class="rounded-lg border border-border bg-canvas-subtle p-3 space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-ink">{draft.medication_name}</span>
								<span class="text-sm text-ink-muted">
									Pedido: {draft.quantity_ordered} {draft.unit_measure}
								</span>
							</div>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div class="col-span-2 sm:col-span-1">
									<label for="recv-qty-{i}" class="block text-sm font-medium text-ink-muted mb-1">
										Cant. recibida
									</label>
									<input
										id="recv-qty-{i}"
										type="number"
										min="0"
										max={draft.quantity_ordered}
										bind:value={draft.quantity_received}
										class="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-elevated text-ink focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
									/>
								</div>
								<div class="col-span-2 sm:col-span-1">
									<label for="recv-lot-{i}" class="block text-sm font-medium text-ink-muted mb-1">
										N° Lote <span class="text-red-500">*</span>
									</label>
									<input
										id="recv-lot-{i}"
										type="text"
										bind:value={draft.lot_number}
										placeholder="Ej: L2024-001"
										class="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-elevated text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
									/>
								</div>
								<div class="col-span-2 sm:col-span-1">
									<label for="recv-exp-{i}" class="block text-sm font-medium text-ink-muted mb-1">
										Vencimiento <span class="text-red-500">*</span>
									</label>
									<input
										id="recv-exp-{i}"
										type="date"
										bind:value={draft.expiration_date}
										class="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-elevated text-ink focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
									/>
								</div>
								<div class="col-span-2 sm:col-span-1">
									<label for="recv-cost-{i}" class="block text-sm font-medium text-ink-muted mb-1">
										Costo unit.
									</label>
									<input
										id="recv-cost-{i}"
										type="number"
										min="0"
										step="0.01"
										bind:value={draft.unit_cost}
										class="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-surface-elevated text-ink focus:outline-none focus:ring-2 focus:ring-iris-500/30 focus:border-iris-500"
									/>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</DialogBody>

		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
			<Button
				type="submit"
				variant="primary"
				size="md"
				isLoading={submitting}
				disabled={!isValid || drafts.length === 0}
			>
				Confirmar recepción
			</Button>
		</DialogFooter>
	</form>
</Dialog>
