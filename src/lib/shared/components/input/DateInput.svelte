<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface DateInputProps extends Omit<HTMLInputAttributes, 'size' | 'type'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		/** Date format for display */
		displayFormat?: 'short' | 'medium' | 'long';
		inputRef?: HTMLInputElement;
	}

	let {
		inputSize = 'md',
		displayFormat,
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: DateInputProps = $props();
</script>

{#snippet calendarIcon()}
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
			d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
		/>
	</svg>
{/snippet}

<Input
	bind:inputRef
	type="date"
	{inputSize}
	icon={calendarIcon}
	iconPosition="left"
	{label}
	{error}
	{hint}
	class={className}
	{...restProps}
/>
