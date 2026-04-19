<script lang="ts">
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';

	interface SelectOption { value: string; label: string }

	interface Props {
		open: boolean;
		userSubmitting: boolean;
		newUserEmail: string;
		newUserName: string;
		newUserPassword: string;
		newUserRole: string;
		newUserSpecialtyId: string;
		isDoctor: boolean;
		roleOptions: SelectOption[];
		specialtyOptions: SelectOption[];
		onClose: () => void;
		onSubmit: () => void;
	}

	let {
		open,
		userSubmitting,
		newUserEmail = $bindable(),
		newUserName = $bindable(),
		newUserPassword = $bindable(),
		newUserRole = $bindable(),
		newUserSpecialtyId = $bindable(),
		isDoctor,
		roleOptions,
		specialtyOptions,
		onClose,
		onSubmit
	}: Props = $props();
</script>

<Dialog {open} onClose={onClose} size="md">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">Nuevo Usuario</h2>
		<p class="text-xs text-ink-muted">Crear cuenta de staff (analista, doctor, farmacéutico, admin)</p>
	</DialogHeader>
	<DialogBody>
		<div class="space-y-3">
			<Input label="Nombre completo *" bind:value={newUserName} placeholder="Dr. Juan Pérez" />
			<Input label="Email *" type="email" bind:value={newUserEmail} placeholder="juan.perez@camiula.edu.ve" />
			<Input label="Contraseña *" type="password" bind:value={newUserPassword} placeholder="Mínimo 8 caracteres" hint="Mínimo 8 caracteres" />
			<Select
				label="Rol"
				options={[{ value: '', label: 'Seleccionar rol...' }, ...roleOptions]}
				value={newUserRole}
				onchange={(v) => { if (typeof v === 'string') { newUserRole = v; newUserSpecialtyId = ''; } }}
			/>
			{#if isDoctor}
				<Select
					label="Especialidad *"
					options={specialtyOptions}
					value={newUserSpecialtyId}
					onchange={(v) => { if (typeof v === 'string') newUserSpecialtyId = v; }}
				/>
			{/if}
		</div>
	</DialogBody>
	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={onClose}>Cancelar</Button>
		<Button
			type="button"
			variant="primary"
			size="md"
			isLoading={userSubmitting}
			disabled={!newUserEmail || !newUserName || !newUserPassword || (isDoctor && !newUserSpecialtyId)}
			onclick={onSubmit}
		>
			Crear usuario
		</Button>
	</DialogFooter>
</Dialog>
