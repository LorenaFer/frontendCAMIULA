<script lang="ts">
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';

	interface SelectOption { value: string; label: string }

	export interface UsuarioForm {
		email: string;
		name: string;
		password: string;
		role: string;
		specialtyId: string;
	}

	export interface UsuarioDialogOptions {
		roles: SelectOption[];
		specialties: SelectOption[];
	}

	interface Props {
		open: boolean;
		submitting: boolean;
		form: UsuarioForm;
		isDoctor: boolean;
		options: UsuarioDialogOptions;
		onClose: () => void;
		onSubmit: () => void;
	}

	let {
		open,
		submitting,
		form = $bindable(),
		isDoctor,
		options,
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
			<Input label="Nombre completo *" bind:value={form.name} placeholder="Dr. Juan Pérez" />
			<Input label="Email *" type="email" bind:value={form.email} placeholder="juan.perez@camiula.edu.ve" />
			<Input label="Contraseña *" type="password" bind:value={form.password} placeholder="Mínimo 8 caracteres" hint="Mínimo 8 caracteres" />
			<Select
				label="Rol"
				options={[{ value: '', label: 'Seleccionar rol...' }, ...options.roles]}
				value={form.role}
				onchange={(v) => { if (typeof v === 'string') { form.role = v; form.specialtyId = ''; } }}
			/>
			{#if isDoctor}
				<Select
					label="Especialidad *"
					options={options.specialties}
					value={form.specialtyId}
					onchange={(v) => { if (typeof v === 'string') form.specialtyId = v; }}
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
			isLoading={submitting}
			disabled={!form.email || !form.name || !form.password || (isDoctor && !form.specialtyId)}
			onclick={onSubmit}
		>
			Crear usuario
		</Button>
	</DialogFooter>
</Dialog>
