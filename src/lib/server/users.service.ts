import { apiFetch } from './api.js';

export interface User {
	id: string;
	email: string;
	full_name: string;
	phone?: string;
	user_status: string;
	roles: string[];
	created_at?: string;
}

export interface CreateUserInput {
	email: string;
	full_name: string;
	password: string;
	phone?: string;
}

export interface UsersPaginatedResult {
	items: User[];
	pagination: { total: number; page: number; page_size: number; pages: number; has_next: boolean };
}

export async function getUsers(page = 1, pageSize = 25, opts?: { staffOnly?: boolean; search?: string }): Promise<UsersPaginatedResult> {
	const qs = new URLSearchParams();
	qs.set('page', String(page));
	qs.set('page_size', String(pageSize));
	if (opts?.staffOnly) qs.set('staff_only', 'true');
	if (opts?.search) qs.set('search', opts.search);
	const raw = await apiFetch<unknown>(`/users?${qs}`);
	if (Array.isArray(raw)) {
		return { items: raw as User[], pagination: { total: raw.length, page: 1, page_size: raw.length, pages: 1, has_next: false } };
	}
	const obj = raw as Record<string, unknown>;
	const items = (obj.items as User[]) ?? [];
	const pg = obj.pagination as Record<string, number>;
	return {
		items,
		pagination: {
			total: Number(pg.total),
			page: Number(pg.page),
			page_size: Number(pg.page_size),
			pages: Number(pg.pages),
			has_next: Number(pg.page) < Number(pg.pages)
		}
	};
}

export async function getUserById(id: string): Promise<User> {
	return apiFetch<User>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput & { roles?: string[] }): Promise<User> {
	return apiFetch<User>('/users', {
		method: 'POST',
		body: JSON.stringify(input)
	});
}

export async function assignRole(userId: string, roleName: string): Promise<void> {
	await apiFetch(`/users/${userId}/roles`, {
		method: 'POST',
		body: JSON.stringify({ role_name: roleName })
	});
}

export async function removeRole(userId: string, roleName: string): Promise<void> {
	await apiFetch(`/users/${userId}/roles/${roleName}`, {
		method: 'DELETE'
	});
}
