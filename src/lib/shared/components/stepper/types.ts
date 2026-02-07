import type { Snippet } from 'svelte';

export interface Step {
	id: string;
	title: string;
	description?: string;
	icon?: Snippet;
}
