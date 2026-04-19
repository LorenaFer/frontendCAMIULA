<script lang="ts">
	import type { DataTableColumn, RowMenuItem } from '$shared/components/table/types.js';
	import type { User } from '$lib/server/admin/users.service.js';
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import DataTable from '$shared/components/table/DataTable.svelte';
	import PaginationBar from '$shared/components/table/PaginationBar.svelte';

	type UserRow = User & Record<string, unknown>;

	interface Props {
		userItems: User[];
		userPagination: { total: number; page: number; page_size: number; pages: number; has_next: boolean };
		userTotal: number;
		roleLabels: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'danger' }>;
		onNew: () => void;
		onAssignRole: (userId: string, roleName: string) => void;
		onPageChange: (p: number) => void;
		onPageSizeChange: (ps: number) => void;
	}

	let {
		userItems,
		userPagination,
		userTotal,
		roleLabels,
		onNew,
		onAssignRole,
		onPageChange,
		onPageSizeChange
	}: Props = $props();
</script>

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

<div class="flex items-center justify-between">
	<p class="text-sm text-ink-muted">{userTotal} usuarios registrados</p>
	<Button variant="primary" size="sm" onclick={onNew}>+ Nuevo Usuario</Button>
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
				{ label: 'Asignar Admin', icon: 'edit', onclick: (row) => onAssignRole(row.id as string, 'administrador') },
				{ label: 'Asignar Doctor', icon: 'edit', onclick: (row) => onAssignRole(row.id as string, 'doctor') },
				{ label: 'Asignar Analista', icon: 'edit', onclick: (row) => onAssignRole(row.id as string, 'analista') },
				{ label: 'Asignar Farmacéutico', icon: 'edit', onclick: (row) => onAssignRole(row.id as string, 'farmaceutico') }
			] satisfies RowMenuItem<UserRow>[]}
			emptyMessage="No hay usuarios registrados."
		/>
		<PaginationBar
			page={userPagination.page}
			total={userPagination.total}
			pageSize={userPagination.page_size}
			pageSizeOptions={[10, 25, 50]}
			onPageChange={onPageChange}
			onPageSizeChange={onPageSizeChange}
		/>
	</Card>
{/if}
