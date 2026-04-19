<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { Medication, MedicationCategory } from '$domain/inventory/types.js';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	interface Props {
		showCreateForm: boolean;
		editingMed: Medication | null;
		nextCode: string;
		categoryOptions: MedicationCategory[];
		onCreateClose: () => void;
		onEditClose: () => void;
	}

	let {
		showCreateForm,
		editingMed,
		nextCode,
		categoryOptions,
		onCreateClose,
		onEditClose
	}: Props = $props();

	let creating = $state(false);
	let saving = $state(false);
</script>

<!-- Formulario de creación -->
{#if showCreateForm}
	<Card padding="md">
		<h2 class="text-sm font-semibold text-ink mb-4">Nuevo medicamento</h2>

		<form
			method="POST"
			action="?/crearMedicamento"
			use:enhance={() => {
				creating = true;
				return async ({ result, update }) => {
					creating = false;
					await update();
					if (result.type === 'success') {
						toastSuccess('Medicamento creado', 'El medicamento fue registrado correctamente.');
						onCreateClose();
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al crear', (result.data as { error?: string })?.error ?? 'No se pudo crear el medicamento.');
					}
				};
			}}
			class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
		>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="code">Código *</label>
				<input id="code" name="code" type="text" required readonly value={nextCode}
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-canvas-subtle text-ink-muted cursor-not-allowed
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60 uppercase"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="generic_name">Nombre genérico *</label>
				<input id="generic_name" name="generic_name" type="text" required
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="commercial_name">Nombre comercial</label>
				<input id="commercial_name" name="commercial_name" type="text"
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="pharmaceutical_form">Forma farmacéutica *</label>
				<select id="pharmaceutical_form" name="pharmaceutical_form" required
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				>
					<option value="">Seleccionar...</option>
					<option value="Tableta">Tableta</option>
					<option value="Cápsula">Cápsula</option>
					<option value="Jarabe">Jarabe</option>
					<option value="Inyectable">Inyectable</option>
					<option value="Crema">Crema</option>
					<option value="Ungüento">Ungüento</option>
					<option value="Gotas">Gotas</option>
					<option value="Suspensión">Suspensión</option>
					<option value="Solución">Solución</option>
					<option value="Supositorio">Supositorio</option>
					<option value="Parche">Parche</option>
					<option value="Inhalador">Inhalador</option>
					<option value="Polvo">Polvo</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="concentration">Concentración</label>
				<input id="concentration" name="concentration" type="text" placeholder="500mg"
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="unit_measure">Unidad de medida *</label>
				<select id="unit_measure" name="unit_measure" required
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				>
					<option value="">Seleccionar...</option>
					<option value="tabletas">Tabletas</option>
					<option value="cápsulas">Cápsulas</option>
					<option value="mL">mL (mililitros)</option>
					<option value="mg">mg (miligramos)</option>
					<option value="g">g (gramos)</option>
					<option value="unidades">Unidades</option>
					<option value="ampollas">Ampollas</option>
					<option value="sobres">Sobres</option>
					<option value="parches">Parches</option>
					<option value="dosis">Dosis</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="therapeutic_class">Clase terapéutica</label>
				<select id="therapeutic_class" name="therapeutic_class"
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				>
					<option value="">Seleccionar (opcional)...</option>
					<option value="Analgésico">Analgésico</option>
					<option value="Antibiótico">Antibiótico</option>
					<option value="Antiinflamatorio">Antiinflamatorio</option>
					<option value="Antihipertensivo">Antihipertensivo</option>
					<option value="Antidiabético">Antidiabético</option>
					<option value="Antihistamínico">Antihistamínico</option>
					<option value="Antipirético">Antipirético</option>
					<option value="Ansiolítico">Ansiolítico</option>
					<option value="Broncodilatador">Broncodilatador</option>
					<option value="Corticosteroide">Corticosteroide</option>
					<option value="Diurético">Diurético</option>
					<option value="Gastroprotector">Gastroprotector</option>
					<option value="Vitamina/Suplemento">Vitamina/Suplemento</option>
					<option value="Otro">Otro</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-medium text-ink-muted mb-1" for="fk_category_id">Categoría</label>
				<select id="fk_category_id" name="fk_category_id"
					class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
					       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
				>
					<option value="">Sin categoría</option>
					{#each categoryOptions as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>
			<input type="hidden" name="controlled_substance" value="false" />
			<input type="hidden" name="requires_refrigeration" value="false" />

			<div class="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-1">
				<Button type="button" variant="ghost" size="md" onclick={onCreateClose}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" isLoading={creating}>Crear medicamento</Button>
			</div>
		</form>
	</Card>
{/if}

<!-- Modal de edición de medicamento -->
{#if editingMed}
	<Dialog open={true} onClose={onEditClose} size="lg">
		<DialogHeader>
			<p class="text-sm text-ink-muted font-normal">Código: {editingMed.code}</p>
			<h2 class="text-base font-semibold text-ink">Editar medicamento</h2>
		</DialogHeader>
		<form
			method="POST"
			action="?/editarMedicamento"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					await update();
					if (result.type === 'success') {
						toastSuccess('Medicamento actualizado', 'Los cambios fueron guardados correctamente.');
						onEditClose();
						await invalidateAll();
					} else if (result.type === 'failure') {
						toastError('Error al editar', (result.data as { error?: string })?.error ?? 'No se pudo actualizar el medicamento.');
					}
				};
			}}
		>
			<input type="hidden" name="id" value={editingMed.id} />
			<DialogBody>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-code">Código</label>
						<input
							id="edit-code"
							type="text"
							disabled
							value={editingMed.code}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-canvas-subtle text-ink-muted cursor-not-allowed"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-generic-name">Nombre genérico *</label>
						<input
							id="edit-generic-name"
							name="generic_name"
							type="text"
							required
							value={editingMed.generic_name}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-commercial-name">Nombre comercial</label>
						<input
							id="edit-commercial-name"
							name="commercial_name"
							type="text"
							value={editingMed.commercial_name ?? ''}
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-pharmaceutical-form">Forma farmacéutica *</label>
						<select
							id="edit-pharmaceutical-form"
							name="pharmaceutical_form"
							required
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Seleccionar...</option>
							{#each ['Tableta', 'Cápsula', 'Jarabe', 'Inyectable', 'Crema', 'Ungüento', 'Gotas', 'Suspensión', 'Solución', 'Supositorio', 'Parche', 'Inhalador', 'Polvo'] as opt}
								<option value={opt} selected={editingMed.pharmaceutical_form === opt}>{opt}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-concentration">Concentración</label>
						<input
							id="edit-concentration"
							name="concentration"
							type="text"
							value={editingMed.concentration ?? ''}
							placeholder="500mg"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-unit-measure">Unidad de medida *</label>
						<select
							id="edit-unit-measure"
							name="unit_measure"
							required
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Seleccionar...</option>
							{#each [['tabletas', 'Tabletas'], ['cápsulas', 'Cápsulas'], ['mL', 'mL (mililitros)'], ['mg', 'mg (miligramos)'], ['g', 'g (gramos)'], ['unidades', 'Unidades'], ['ampollas', 'Ampollas'], ['sobres', 'Sobres'], ['parches', 'Parches'], ['dosis', 'Dosis']] as [val, label]}
								<option value={val} selected={editingMed.unit_measure === val}>{label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-therapeutic-class">Clase terapéutica</label>
						<select
							id="edit-therapeutic-class"
							name="therapeutic_class"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Sin clase</option>
							{#each ['Analgésico', 'Antibiótico', 'Antiinflamatorio', 'Antihipertensivo', 'Antidiabético', 'Antihistamínico', 'Antipirético', 'Ansiolítico', 'Broncodilatador', 'Corticosteroide', 'Diurético', 'Gastroprotector', 'Vitamina/Suplemento', 'Otro'] as opt}
								<option value={opt} selected={editingMed.therapeutic_class === opt}>{opt}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-ink-muted mb-1" for="edit-category">Categoría</label>
						<select
							id="edit-category"
							name="fk_category_id"
							class="w-full h-11 px-3 text-sm rounded-lg border border-border bg-surface-elevated text-ink
							       hover:border-border-strong focus:outline-none focus:border-viking-400 focus:ring-2 focus:ring-viking-100/60"
						>
							<option value="">Sin categoría</option>
							{#each categoryOptions as cat}
								<option value={cat.id} selected={editingMed.fk_category_id === cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</DialogBody>
			<DialogFooter>
				<Button type="button" variant="ghost" size="md" onclick={onEditClose}>Cancelar</Button>
				<Button type="submit" variant="primary" size="md" isLoading={saving}>Guardar cambios</Button>
			</DialogFooter>
		</form>
	</Dialog>
{/if}
