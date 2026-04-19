<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PurchaseOrder } from '$domain/inventory/types.js';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import DateInput from '$shared/components/input/DateInput.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';
	import { receivePurchaseOrder } from '$domain/inventory/inventory-client.js';

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
		medication_code: string;
		pharmaceutical_form: string;
		unit_measure: string;
		quantity_ordered: number;
		already_received: number;
		quantity_received: number;
		lot_number: string;
		expiration_date: string;
		unit_cost: number;
	}

	let submitting = $state(false);

	// Autogenerar número de lote basado en la orden
	const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

	let drafts = $state<ReceiveDraft[]>(
		order.items
			.filter(item => item.quantity_received < item.quantity_ordered)
			.map((item, idx) => ({
				purchase_order_item_id: item.id,
				medication_name: item.medication?.generic_name ?? 'Medicamento',
				medication_code: item.medication?.code ?? '',
				pharmaceutical_form: item.medication?.pharmaceutical_form ?? '',
				unit_measure: item.medication?.unit_measure ?? 'Unidad',
				quantity_ordered: item.quantity_ordered,
				already_received: item.quantity_received,
				quantity_received: item.quantity_ordered - item.quantity_received,
				lot_number: `LOT-${order.order_number?.replace('OC-', '') ?? today}-${String(idx + 1).padStart(2, '0')}`,
				expiration_date: '',
				unit_cost: item.unit_cost ?? 0
			}))
	);

	const totalItems = $derived(drafts.length);
	const totalUnits = $derived(drafts.reduce((sum, d) => sum + d.quantity_received, 0));
	const completedItems = $derived(drafts.filter(d => d.lot_number.trim() && d.expiration_date).length);

	const isValid = $derived(
		drafts.length > 0 && drafts.every(
			(d) =>
				d.lot_number.trim().length > 0 &&
				d.expiration_date.length > 0 &&
				d.quantity_received > 0
		)
	);

	async function handleSubmit() {
		submitting = true;
		try {
			await receivePurchaseOrder({
				order_id: order.id,
				items: drafts.map((d) => ({
					purchase_order_item_id: d.purchase_order_item_id,
					quantity_received: d.quantity_received,
					lot_number: d.lot_number,
					expiration_date: d.expiration_date,
					unit_cost: d.unit_cost
				}))
			});
			toastSuccess('Recepción registrada', `${totalUnits} unidades de ${totalItems} medicamento(s) ingresados al inventario.`);
			await invalidateAll();
			onClose();
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Error de conexión al registrar la recepción.';
			toastError('Error al registrar', msg);
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog open={true} {onClose} size="full">
	<DialogHeader>
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-lg bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center">
				<svg class="w-4 h-4 text-sage-600 dark:text-sage-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				</svg>
			</div>
			<div>
				<h2 class="text-base font-semibold text-ink">Registrar Recepción</h2>
				<p class="text-xs text-ink-muted">Orden <span class="font-mono">{order.order_number}</span> · {order.supplier?.name ?? 'Proveedor'}</p>
			</div>
		</div>
	</DialogHeader>

	<DialogBody>
		<div class="space-y-4">
			<!-- Resumen -->
			<div class="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-canvas-subtle border border-border/40">
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-muted">Medicamentos:</span>
					<span class="text-sm font-semibold text-ink">{totalItems}</span>
				</div>
				<div class="w-px h-4 bg-border/60"></div>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-muted">Unidades a recibir:</span>
					<span class="text-sm font-semibold text-ink">{totalUnits}</span>
				</div>
				<div class="w-px h-4 bg-border/60"></div>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-muted">Completados:</span>
					<span class="text-sm font-semibold {completedItems === totalItems ? 'text-sage-600 dark:text-sage-400' : 'text-ink'}">{completedItems}/{totalItems}</span>
				</div>
			</div>

			{#if drafts.length === 0}
				<div class="text-center py-8">
					<svg class="w-10 h-10 text-sage-400 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
					<p class="text-sm font-medium text-ink">Todos los ítems ya fueron recibidos</p>
					<p class="text-xs text-ink-muted mt-1">Esta orden está completa.</p>
				</div>
			{:else}
				{#each drafts as draft, i (draft.purchase_order_item_id)}
					{@const isComplete = draft.lot_number.trim() && draft.expiration_date && draft.quantity_received > 0}
					<div class="rounded-xl border {isComplete ? 'border-sage-200 dark:border-sage-800 bg-sage-50/30 dark:bg-sage-900/10' : 'border-border bg-surface-elevated'} p-4 space-y-3 transition-colors">
						<!-- Header del item -->
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-2.5">
								<div class="w-7 h-7 rounded-lg bg-viking-100 dark:bg-viking-900/30 flex items-center justify-center text-[10px] font-bold text-viking-700 dark:text-viking-300">
									{i + 1}
								</div>
								<div>
									<p class="text-sm font-semibold text-ink">{draft.medication_name}</p>
									<p class="text-xs text-ink-muted">
										{#if draft.medication_code}<span class="font-mono">{draft.medication_code}</span> · {/if}{draft.pharmaceutical_form}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-mono font-semibold text-ink">{draft.quantity_ordered} {draft.unit_measure}</p>
								{#if draft.already_received > 0}
									<p class="text-[10px] text-ink-muted">Ya recibidos: {draft.already_received}</p>
								{/if}
							</div>
						</div>

						<!-- Campos -->
						<div class="grid grid-cols-3 gap-3">
							<Input
								label="Cantidad a recibir"
								type="number"
								bind:value={draft.quantity_received}
								hint="Máx: {draft.quantity_ordered - draft.already_received}"
							/>
							<Input
								label="N° de Lote *"
								bind:value={draft.lot_number}
								placeholder="LOT-2026-001"
							/>
							<Input
								label="Costo unitario (Bs)"
								type="number"
								bind:value={draft.unit_cost}
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<DateInput
								label="Fecha de vencimiento *"
								bind:value={draft.expiration_date}
								hint="Fecha impresa en el empaque"
							/>
							<div class="flex items-end pb-1">
								{#if draft.expiration_date}
									{@const daysLeft = Math.ceil((new Date(draft.expiration_date).getTime() - Date.now()) / 86400000)}
									<div class="flex items-center gap-2 px-3 py-2 rounded-lg {daysLeft <= 90 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800'}">
										<svg class="w-4 h-4 {daysLeft <= 90 ? 'text-amber-500' : 'text-sage-500'}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
										</svg>
										<span class="text-sm font-medium {daysLeft <= 90 ? 'text-amber-700 dark:text-amber-300' : 'text-sage-700 dark:text-sage-300'}">
											{daysLeft <= 0 ? 'Vencido' : `${daysLeft} días de vida útil`}
										</span>
									</div>
								{/if}
							</div>
						</div>

						<!-- Status indicator -->
						{#if isComplete}
							<div class="flex items-center gap-1.5 text-xs text-sage-600 dark:text-sage-400">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
								</svg>
								Listo para recibir
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</DialogBody>

	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
		<Button
			type="button"
			variant="primary"
			size="md"
			isLoading={submitting}
			disabled={!isValid}
			onclick={handleSubmit}
		>
			<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
			</svg>
			Confirmar recepción ({totalUnits} uds)
		</Button>
	</DialogFooter>
</Dialog>
