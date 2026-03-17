// ============================================================
// Cliente HTTP centralizado para FastAPI
// AbortController con timeout de 15s para conexiones <10 Mbps
// ============================================================

import { env } from '$env/dynamic/private';

const API_URL = env.API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
	constructor(
		public status: number,
		public body: unknown
	) {
		super(`API error ${status}`);
	}
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);

	try {
		const res = await fetch(`${API_URL}${path}`, {
			...init,
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...init?.headers
			}
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({ detail: res.statusText }));
			throw new ApiError(res.status, body);
		}

		return res.json() as Promise<T>;
	} finally {
		clearTimeout(timeout);
	}
}
