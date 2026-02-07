<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface TimeInputProps extends Omit<HTMLInputAttributes, 'size' | 'type'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		inputRef?: HTMLInputElement;
	}

	let {
		inputSize = 'md',
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: TimeInputProps = $props();
</script>

{#snippet clockIcon()}
	<svg
		class="w-4 h-4"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="1.5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
		/>
	</svg>
{/snippet}

<Input
	bind:inputRef
	type="time"
	{inputSize}
	icon={clockIcon}
	iconPosition="left"
	{label}
	{error}
	{hint}
	class={className}
	{...restProps}
/>
