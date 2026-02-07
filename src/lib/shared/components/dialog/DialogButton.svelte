<script lang="ts">
	import type { Snippet } from 'svelte';

	type DialogButtonVariant = 'primary' | 'secondary' | 'danger';

	const variants: Record<DialogButtonVariant, string> = {
		primary: 'bg-viking-500 text-white hover:bg-viking-600 focus:ring-viking-500/20',
		secondary:
			'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500/20',
		danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20'
	};

	let {
		children,
		onclick,
		variant = 'secondary',
		disabled = false,
		type = 'button',
		class: className = ''
	}: {
		children: Snippet;
		onclick?: () => void;
		variant?: DialogButtonVariant;
		disabled?: boolean;
		type?: 'button' | 'submit';
		class?: string;
	} = $props();
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="
		px-4 py-2 text-sm font-medium rounded-lg transition-colors
		focus:outline-none focus:ring-2 focus:ring-offset-2
		disabled:opacity-50 disabled:cursor-not-allowed
		{variants[variant]}
		{className}
	"
>
	{@render children()}
</button>
