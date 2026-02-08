<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface CheckboxProps extends Omit<HTMLInputAttributes, 'type' | 'size'> {
		label?: string;
		description?: string;
		error?: string;
		checkboxSize?: 'sm' | 'md' | 'lg';
		checked?: boolean;
		inputRef?: HTMLInputElement;
	}

	let {
		label,
		description,
		error,
		checkboxSize = 'md',
		checked = $bindable(false),
		class: className = '',
		id,
		inputRef = $bindable(),
		...restProps
	}: CheckboxProps = $props();

	const checkboxSizeStyles: Record<string, string> = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	let checkboxId = $derived(id || label?.toLowerCase().replace(/\s+/g, '-'));
</script>

<div class="flex items-start gap-3">
	<input
		bind:this={inputRef}
		type="checkbox"
		id={checkboxId}
		bind:checked
		class="{checkboxSizeStyles[checkboxSize]} rounded border-border-strong text-ink focus:ring-2 focus:ring-border focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed {error
			? 'border-red-300'
			: ''} {className}"
		{...restProps}
	/>
	{#if label || description}
		<div class="flex-1">
			{#if label}
				<label for={checkboxId} class="text-sm font-medium text-ink cursor-pointer">
					{label}
				</label>
			{/if}
			{#if description}
				<p class="text-sm text-ink-muted mt-0.5">{description}</p>
			{/if}
			{#if error}
				<p class="text-xs text-red-600 mt-1">{error}</p>
			{/if}
		</div>
	{/if}
</div>
