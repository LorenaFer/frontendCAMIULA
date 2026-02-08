<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface SearchInputProps extends Omit<HTMLInputAttributes, 'size'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		onClear?: () => void;
		inputRef?: HTMLInputElement;
	}

	let {
		onClear,
		value = $bindable(),
		inputSize = 'md',
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: SearchInputProps = $props();

	let computedClass = $derived(`${value && onClear ? 'pr-9' : ''} ${className}`);
</script>

{#snippet searchIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
		/>
	</svg>
{/snippet}

<div class="relative w-full">
	<Input
		bind:inputRef
		{value}
		{inputSize}
		icon={searchIcon}
		iconPosition="left"
		class={computedClass}
		{label}
		{error}
		{hint}
		{...restProps}
	/>
	{#if value && onClear}
		<button
			type="button"
			onclick={onClear}
			class="absolute top-1/2 -translate-y-1/2 right-2.5 p-0.5 text-ink-subtle hover:text-ink-muted rounded transition-colors"
		>
			<svg
				class="w-4 h-4"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	{/if}
</div>
