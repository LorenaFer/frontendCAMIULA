<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { Especialidad } from '$shared/types/appointments.js';
	import type { MedicalFormSchema } from '$shared/types/form-schema.js';
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import type { User } from '$lib/server/users.service.js';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Input from '$shared/components/input/Input.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import Dialog from '$shared/components/dialog/Dialog.svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';
	import DialogBody from '$shared/components/dialog/DialogBody.svelte';
	import DialogFooter from '$shared/components/dialog/DialogFooter.svelte';
	import { toastSuccess, toastError } from '$shared/components/toast/toast.svelte.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ─── Tab state ───────────────────────────────────────────
	let activeTab = $state<'especialidades' | 'formularios' | 'usuarios'>('especialidades');

	// ─── Especialidades ──────────────────────────────────────
	let showEspDialog = $state(false);
	let editingEsp = $state<Especialidad | null>(null);
	let nombreInput = $state('');

	type EspRow = Especialidad & Record<string, unknown>;

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
	const espPages = $derived(Math.ceil(espTotal / espPageSize));
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
	let newUserEmail = $state('');
	let newUserName = $state('');
	let newUserPassword = $state('');
	let newUserRole = $state('analista');

	type UserRow = User & Record<string, unknown>;

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
		if (!newUserEmail || !newUserName || !newUserPassword) {
			toastError('Campos requeridos', 'Email, nombre y contraseña son obligatorios.');
			return;
		}
		userSubmitting = true;
		try {
			const result = await callAction('crearUsuario', {
				email: newUserEmail, full_name: newUserName,
				password: newUserPassword, role: newUserRole
			});
			if (result.status === 'success') {
				toastSuccess('Usuario creado', `${newUserName} fue registrado como ${newUserRole}.`);
				showUserDialog = false;
				newUserEmail = ''; newUserName = ''; newUserPassword = ''; newUserRole = 'analista';
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

	async function handleRemoveRole(userId: string, roleName: string) {
		const result = await callAction('removerRol', { user_id: userId, role_name: roleName });
		if (result.status === 'success') {
			toastSuccess('Rol removido', `Rol ${roleName} removido correctamente.`);
			await invalidateAll();
		} else {
			toastError('Error', result.message);
		}
	}
</script>

<!-- Snippets for DataTable -->
{#snippet espStatusCell(_v: unknown, row: EspRow)}
	<Badge variant={row.activo ? 'success' : 'danger'} style="soft" size="xs">
		{row.activo ? 'Activo' : 'Inactivo'}
	</Badge>
{/snippet}

{#snippet espSchemaCell(_v: unknown, row: EspRow)}
	{@const schema = getSchemaForEsp(row as Especialidad)}
	{#if schema}
		<span class="text-xs text-ink-muted">{countFields(schema)} campos</span>
	{:else}
		<span class="text-xs text-ink-subtle">—</span>
	{/if}
{/snippet}

{#snippet userRolesCell(_v: unknown, row: UserRow)}
	<div class="flex flex-wrap gap-1">
		{#each (row.roles as string[]) as role}
			{@const r = roleLabels[role] ?? { label: role, variant: 'info' as const }}
			<Badge variant={r.variant} style="soft" size="xs">{r.label}</Badge>
		{/each}
	</div>
{/snippet}

{#snippet userStatusCell(_v: unknown, row: UserRow)}
	<Badge variant={row.user_status === 'ACTIVE' ? 'success' : 'danger'} style="soft" size="xs">
		{row.user_status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
	</Badge>
{/snippet}

{#snippet paginationBarClient(pg: { page: number; pageSize: number; total: number; pages: number }, changeFn: (p: number, ps?: number) => void)}
	{#if pg.total > 0}
		<div class="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 border-t border-border/30 bg-canvas-subtle/30">
			<div class="flex items-center gap-3">
				<p class="text-xs text-ink-muted">{((pg.page - 1) * pg.pageSize) + 1}–{Math.min(pg.page * pg.pageSize, pg.total)} de {pg.total}</p>
				<div class="flex items-center gap-1.5">
					<span class="text-xs text-ink-subtle">Mostrar</span>
					<select class="text-xs border border-border/60 rounded-md px-1.5 py-1 bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-viking-500/40"
						value={pg.pageSize}
						onchange={(e) => changeFn(1, Number((e.target as HTMLSelectElement).value))}
					>
						{#each [10, 25, 50] as size}<option value={size}>{size}</option>{/each}
					</select>
				</div>
			</div>
			{#if pg.pages > 1}
				<div class="flex items-center gap-1">
					<button type="button" disabled={pg.page <= 1} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changeFn(pg.page - 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
					</button>
					{#each Array.from({ length: Math.min(pg.pages, 7) }, (_, i) => { const start = Math.max(1, Math.min(pg.page - 3, pg.pages - 6)); return start + i; }) as p}
						<button type="button" class="w-7 h-7 rounded-md text-xs font-medium transition-colors {p === pg.page ? 'bg-viking-600 text-white' : 'text-ink-muted hover:bg-canvas-subtle'}" onclick={() => changeFn(p)}>{p}</button>
					{/each}
					<button type="button" disabled={pg.page >= pg.pages} class="px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-ink-muted hover:bg-canvas-subtle" onclick={() => changeFn(pg.page + 1)}>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
					</button>
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<svelte:head>
	<title>Configuración</title>
</svelte:head>

<div class="animate-fade-in-up space-y-5">
	<div>
		<h1 class="text-xl font-bold text-ink">Configuración</h1>
		<p class="text-sm text-ink-muted mt-0.5">Gestión de especialidades, formularios y usuarios</p>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-border">
		{#each [
			{ id: 'especialidades' as const, label: 'Especialidades', count: espTotal },
			{ id: 'formularios' as const, label: 'Formularios HMD' },
			{ id: 'usuarios' as const, label: 'Usuarios', count: userTotal }
		] as tab}
			<button
				class="px-4 py-2.5 text-sm font-medium transition-colors relative {activeTab === tab.id ? 'text-viking-600' : 'text-ink-muted hover:text-ink'}"
				onclick={() => { activeTab = tab.id; }}
			>
				{tab.label}
				{#if tab.count != null}
					<span class="ml-1 text-xs text-ink-subtle">({tab.count})</span>
				{/if}
				{#if activeTab === tab.id}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-viking-600"></div>
				{/if}
			</button>
		{/each}
	</div>

	<!-- ═══ TAB: Especialidades ═══ -->
	{#if activeTab === 'especialidades'}
		<div class="flex items-center justify-between">
			<p class="text-sm text-ink-muted">{espTotal} especialidades registradas</p>
			<Button variant="primary" size="sm" onclick={openNewEsp}>+ Nueva Especialidad</Button>
		</div>

		<Card padding="none">
			<DataTable
				columns={[
					{ key: 'nombre', header: 'Nombre' },
					{ key: 'activo', header: 'Estado', width: '100px', align: 'center', render: espStatusCell },
					{ key: 'id', header: 'Formulario', width: '120px', align: 'center', render: espSchemaCell }
				] satisfies DataTableColumn<EspRow>[]}
				data={espPaginated as EspRow[]}
				rowKey="id"
				rowMenu={[
					{ label: 'Editar', icon: 'edit', onclick: (row) => openEditEsp(row as unknown as Especialidad) }
				] satisfies RowMenuItem<EspRow>[]}
				emptyMessage="No hay especialidades registradas."
			/>
			{@render paginationBarClient(
				{ page: espPage, pageSize: espPageSize, total: espTotal, pages: espPages },
				(p, ps) => { if (ps) { espPageSize = ps; espPage = 1; } else espPage = p; }
			)}
		</Card>
	{/if}

	<!-- ═══ TAB: Formularios HMD ═══ -->
	{#if activeTab === 'formularios'}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each realEspecialidades.filter((e: Especialidad) => e.activo) as esp (esp.id)}
				{@const schema = getSchemaForEsp(esp)}
				<a
					href="/admin/configuracion/form-builder?specialty={encodeURIComponent(esp.nombre)}"
					class="block bg-surface rounded-xl border border-border/60 p-5 shadow-[var(--shadow-1)]
						hover:border-viking-300 dark:hover:border-viking-700 hover:shadow-[var(--shadow-2)] transition-all group"
				>
					<div class="flex items-start justify-between mb-3">
						<h3 class="text-sm font-semibold text-ink group-hover:text-viking-600 transition-colors">{esp.nombre}</h3>
						<svg class="w-4 h-4 text-ink-subtle group-hover:text-viking-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
						</svg>
					</div>
					{#if schema}
						<div class="space-y-1.5">
							<div class="flex items-center gap-2 text-xs text-ink-muted">
								<span>{schema.sections.length} secciones</span>
								<span class="text-border">|</span>
								<span>{countFields(schema)} campos</span>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
								<span class="text-xs text-emerald-600 dark:text-emerald-400">Formulario configurado</span>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
							<span class="text-xs text-amber-600 dark:text-amber-400">Sin formulario — usa Medicina General</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}

	<!-- ═══ TAB: Usuarios ═══ -->
	{#if activeTab === 'usuarios'}
		<div class="flex items-center justify-between">
			<p class="text-sm text-ink-muted">{userTotal} usuarios registrados</p>
			<Button variant="primary" size="sm" onclick={() => { showUserDialog = true; }}>+ Nuevo Usuario</Button>
		</div>

		{#if userItems.length === 0 && userPagination.total === 0}
			<Card padding="lg">
				<div class="text-center py-8">
					<svg class="w-12 h-12 text-ink-subtle mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
					</svg>
					<p class="text-sm font-medium text-ink">Sin acceso a usuarios</p>
					<p class="text-xs text-ink-muted mt-1">El endpoint de usuarios requiere permisos de administrador en el backend.</p>
				</div>
			</Card>
		{:else}
			<Card padding="none">
				<DataTable
					columns={[
						{ key: 'full_name', header: 'Nombre' },
						{ key: 'email', header: 'Email' },
						{ key: 'roles', header: 'Roles', width: '200px', render: userRolesCell },
						{ key: 'user_status', header: 'Estado', width: '100px', align: 'center', render: userStatusCell }
					] satisfies DataTableColumn<UserRow>[]}
					data={userItems as UserRow[]}
					rowKey="id"
					rowMenu={[
						{ label: 'Asignar Admin', icon: 'edit', onclick: (row) => handleAssignRole(row.id as string, 'administrador') },
						{ label: 'Asignar Doctor', icon: 'edit', onclick: (row) => handleAssignRole(row.id as string, 'doctor') },
						{ label: 'Asignar Analista', icon: 'edit', onclick: (row) => handleAssignRole(row.id as string, 'analista') },
						{ label: 'Asignar Farmacéutico', icon: 'edit', onclick: (row) => handleAssignRole(row.id as string, 'farmaceutico') }
					] satisfies RowMenuItem<UserRow>[]}
					emptyMessage="No hay usuarios registrados."
				/>
				{@render paginationBarClient(
					{ page: userPagination.page, pageSize: userPagination.page_size, total: userPagination.total, pages: userPagination.pages },
					changeUserPage
				)}
			</Card>
		{/if}
	{/if}
</div>

<!-- Dialog: Nueva / Editar Especialidad -->
<Dialog open={showEspDialog} onClose={closeEspDialog} size="sm">
	<DialogHeader>
		<h2 class="text-base font-semibold text-ink">
			{editingEsp ? 'Editar Especialidad' : 'Nueva Especialidad'}
		</h2>
	</DialogHeader>
	<form
		method="POST"
		action="?/guardarEspecialidad"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') {
					toastSuccess('Guardado', editingEsp ? 'Especialidad actualizada.' : 'Especialidad creada.');
					closeEspDialog();
					invalidateAll();
				}
			};
		}}
	>
		<DialogBody>
			{#if editingEsp}
				<input type="hidden" name="id" value={editingEsp.id} />
			{/if}
			<Input
				name="nombre"
				label="Nombre de la especialidad"
				bind:value={nombreInput}
				placeholder="Ej: Cardiología"
			/>
		</DialogBody>
		<DialogFooter>
			<Button type="button" variant="ghost" size="md" onclick={closeEspDialog}>Cancelar</Button>
			<Button type="submit" variant="primary" size="md" disabled={!nombreInput.trim()}>
				{editingEsp ? 'Guardar cambios' : 'Crear especialidad'}
			</Button>
		</DialogFooter>
	</form>
</Dialog>

<!-- Dialog: Nuevo Usuario -->
<Dialog open={showUserDialog} onClose={() => { showUserDialog = false; }} size="md">
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
				onchange={(v) => { if (typeof v === 'string') newUserRole = v; }}
			/>
		</div>
	</DialogBody>
	<DialogFooter>
		<Button type="button" variant="ghost" size="md" onclick={() => { showUserDialog = false; }}>Cancelar</Button>
		<Button
			type="button"
			variant="primary"
			size="md"
			isLoading={userSubmitting}
			disabled={!newUserEmail || !newUserName || !newUserPassword}
			onclick={handleCreateUser}
		>
			Crear usuario
		</Button>
	</DialogFooter>
</Dialog>
