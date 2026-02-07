<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface PhoneInputProps extends Omit<HTMLInputAttributes, 'size' | 'value' | 'onchange'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		value?: string;
		onchange?: (value: string) => void;
		/** Country code format */
		format?: 'US' | 'international';
		inputRef?: HTMLInputElement;
	}

	let {
		value = $bindable(''),
		onchange,
		format = 'US',
		inputSize = 'md',
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: PhoneInputProps = $props();

	function formatPhoneUS(val: string): string {
		const digits = val.replace(/\D/g, '').slice(0, 10);
		if (digits.length === 0) return '';
		if (digits.length <= 3) return `(${digits}`;
		if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const rawValue = target.value;
		const digits = rawValue.replace(/\D/g, '');
		const formatted = format === 'US' ? formatPhoneUS(rawValue) : digits;
		value = formatted;
		onchange?.(formatted);
	}
</script>

{#snippet phoneIcon()}
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
			d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
		/>
	</svg>
{/snippet}

<Input
	bind:inputRef
	type="tel"
	{value}
	oninput={handleInput}
	{inputSize}
	placeholder={format === 'US' ? '(555) 555-5555' : '+1 555 555 5555'}
	icon={phoneIcon}
	iconPosition="left"
	{label}
	{error}
	{hint}
	class={className}
	{...restProps}
/>
