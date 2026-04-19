<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { Especialidad } from '$domain/staff/types.js';
	import type { MedicalFormSchema } from '$domain/medical-records/form-schema.js';
	import type { User } from '$lib/server/admin/users.service.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';
	import { TabGroup } from '$shared/components/tabs';
	import EspecialidadesTab from '$domain/admin/components/tabs/EspecialidadesTab.svelte';
	import FormulariosTab from '$domain/admin/components/tabs/FormulariosTab.svelte';
	import UsuariosTab from '$domain/admin/components/tabs/UsuariosTab.svelte';
	import EspecialidadDialog from '$domain/admin/components/dialogs/EspecialidadDialog.svelte';
	import UsuarioDialog from '$domain/admin/components/dialogs/UsuarioDialog.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ─── Tab state ───────────────────────────────────────────
	let activeTab = $state<'especialidades' | 'formularios' | 'usuarios'>('especialidades');

	// ─── Especialidades ──────────────────────────────────────
	let showEspDialog = $state(false);
	let editingEsp = $state<Especialidad | null>(null);
	let nombreInput = $state('');

	function openNewEsp() { editingEsp = null; nombreInput = ''; showEspDialog = true; }
	function openEditEsp(esp: Especialidad) { editingEsp = esp; nombreInput = esp.nombre; showEspDialog = true; }
	function closeEspDialog() { showEspDialog = false; editingEsp = null; nombreInput = ''; }

	// Filter out test/UUID specialties
	const realEspecialidades = $derived(
		data.especialidades.filter((e: Especialidad) => !/^(Specialty-|E2E-|[0-9a-f]{8})/.test(e.nombre ?? ''))
	);

	// Client-side pagination for especialidades
	let espPage = $state(1);
	let espPageSize = $state(10);
	const espTotal = $derived(realEspecialidades.length);
	const espPaginated = $derived(realEspecialidades.slice((espPage - 1) * espPageSize, espPage * espPageSize));

	function getSchemaForEsp(esp: Especialidad): MedicalFormSchema | undefined {
		const key = (esp.nombre ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
		return data.schemas.find((s: MedicalFormSchema) => s.specialtyId === key || s.specialtyId === esp.id);
	}

	function countFields(schema: MedicalFormSchema): number {
		return schema.sections.reduce((total: number, s) => total + s.groups.reduce((gt: number, g) => gt + g.fields.length, 0), 0);
	}

	// ─── Usuarios ────────────────────────────────────────────
	let showUserDialog = $state(false);
	let userSubmitting = $state(false);
	let userForm = $state({
		email: '',
		name: '',
		password: '',
		role: 'analista',
		specialtyId: ''
	});

	const isDoctor = $derived(userForm.role === 'doctor');
	const specialtyOptions = $derived([
		{ value: '', label: 'Seleccionar especialidad...' },
		...realEspecialidades.filter((e: Especialidad) => e.activo).map((e: Especialidad) => ({ value: e.id, label: e.nombre }))
	]);

	const roleLabels: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'danger' }> = {
		administrador: { label: 'Admin', variant: 'danger' },
		admin: { label: 'Admin', variant: 'danger' },
		doctor: { label: 'Doctor', variant: 'info' },
		medico: { label: 'Doctor', variant: 'info' },
		analista: { label: 'Analista', variant: 'success' },
		farmaceutico: { label: 'Farmacéutico', variant: 'warning' },
		paciente: { label: 'Paciente', variant: 'info' }
	};

	const roleOptions = [
		{ value: 'analista', label: 'Analista' },
		{ value: 'doctor', label: 'Doctor' },
		{ value: 'farmaceutico', label: 'Farmacéutico' },
		{ value: 'administrador', label: 'Administrador' }
	];

	// Server-side pagination for users
	const usersData = $derived(data.users as { items: User[]; pagination: { total: number; page: number; page_size: number; pages: number; has_next: boolean } });
	const userItems = $derived(usersData.items);
	const userPagination = $derived(usersData.pagination);
	const userTotal = $derived(userPagination.total);

	function changeUserPage(p: number, ps?: number) {
		const qs = new URLSearchParams($page.url.searchParams);
		qs.set('user_page', String(p));
		if (ps) qs.set('user_page_size', String(ps));
		goto(`?${qs}`, { replaceState: true });
	}

	async function callAction(action: string, body: Record<string, unknown>) {
		const res = await fetch('/admin/configuracion', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ...body })
		});
		return res.json();
	}

	async function handleCreateUser() {
		if (!userForm.email || !userForm.name || !userForm.password) {
			toastError('Campos requeridos', 'Email, nombre y contraseña son obligatorios.');
			return;
		}
		if (isDoctor && !userForm.specialtyId) {
			toastError('Especialidad requerida', 'Debe seleccionar una especialidad para el doctor.');
			return;
		}
		userSubmitting = true;
		try {
			const result = await callAction('crearUsuario', {
				email: userForm.email, full_name: userForm.name,
				password: userForm.password, role: userForm.role,
				specialty_id: isDoctor ? userForm.specialtyId : undefined
			});
			if (result.status === 'success') {
				toastSuccess('Usuario creado', `${userForm.name} fue registrado como ${userForm.role}.`);
				showUserDialog = false;
				userForm = { email: '', name: '', password: '', role: 'analista', specialtyId: '' };
				await invalidateAll();
			} else {
				toastError('Error', result.message);
			}
		} catch {
			toastError('Error', 'No se pudo crear el usuario.');
		} finally {
			userSubmitting = false;
		}
	}

	async function handleAssignRole(userId: string, roleName: string) {
		const result = await callAction('asignarRol', { user_id: userId, role_name: roleName });
		if (result.status === 'success') {
			toastSuccess('Rol asignado', `Rol ${roleName} asignado correctamente.`);
			await invalidateAll();
		} else {
			toastError('Error', result.message);
		}
	}
</script>

<svelte:head>
	<title>Configuración</title>
</svelte:head>

<div class="animate-fade-in-up space-y-5">
	<div>
		<h1 class="text-xl font-bold text-ink">Configuración</h1>
		<p class="text-sm text-ink-muted mt-0.5">Gestión de especialidades, formularios y usuarios</p>
	</div>

	<!-- Tabs -->
	<TabGroup
		tabs={[
			{ id: 'especialidades', label: 'Especialidades', count: espTotal },
			{ id: 'formularios', label: 'Formularios HMD' },
			{ id: 'usuarios', label: 'Usuarios', count: userTotal }
		]}
		bind:active={activeTab}
		variant="underline"
	/>

	{#if activeTab === 'especialidades'}
		<EspecialidadesTab
			pagination={{ items: espPaginated, total: espTotal, page: espPage, pageSize: espPageSize }}
			helpers={{ getForEsp: getSchemaForEsp, countFields }}
			onNew={openNewEsp}
			onEdit={openEditEsp}
			onPageChange={(p) => { espPage = p; }}
			onPageSizeChange={(ps) => { espPageSize = ps; espPage = 1; }}
		/>
	{/if}

	{#if activeTab === 'formularios'}
		<FormulariosTab
			especialidades={realEspecialidades}
			{getSchemaForEsp}
			{countFields}
		/>
	{/if}

	{#if activeTab === 'usuarios'}
		<UsuariosTab
			{userItems}
			{userPagination}
			{userTotal}
			{roleLabels}
			onNew={() => { showUserDialog = true; }}
			onAssignRole={handleAssignRole}
			onPageChange={(p) => changeUserPage(p)}
			onPageSizeChange={(ps) => changeUserPage(1, ps)}
		/>
	{/if}
</div>

<EspecialidadDialog
	open={showEspDialog}
	{editingEsp}
	bind:nombreInput
	onClose={closeEspDialog}
/>

<UsuarioDialog
	open={showUserDialog}
	submitting={userSubmitting}
	bind:form={userForm}
	{isDoctor}
	options={{ roles: roleOptions, specialties: specialtyOptions }}
	onClose={() => { showUserDialog = false; }}
	onSubmit={handleCreateUser}
/>
