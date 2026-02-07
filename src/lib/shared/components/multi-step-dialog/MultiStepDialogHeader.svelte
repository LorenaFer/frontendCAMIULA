<script lang="ts">
	import type { Snippet } from 'svelte';
	import DialogHeader from '$shared/components/dialog/DialogHeader.svelte';

	let {
		children,
		showClose = true,
		class: className = ''
	}: {
		children: Snippet;
		showClose?: boolean;
		class?: string;
	} = $props();
</script>

<DialogHeader {showClose} class={className}>
	{@render children()}
</DialogHeader>
