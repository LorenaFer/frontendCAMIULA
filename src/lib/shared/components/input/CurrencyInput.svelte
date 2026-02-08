<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Input from './Input.svelte';

	type InputSize = 'sm' | 'md' | 'lg';

	interface CurrencyInputProps extends Omit<HTMLInputAttributes, 'size' | 'value' | 'onchange'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		value?: number | string;
		onchange?: (value: number | undefined) => void;
		currency?: string;
		locale?: string;
		inputRef?: HTMLInputElement;
	}

	let {
		value = $bindable(),
		onchange,
		currency = 'USD',
		locale = 'en-US',
		inputSize = 'md',
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: CurrencyInputProps = $props();

	let displayValue = $state('');

	// Sync display value from external value changes
	$effect(() => {
		if (value === undefined || value === '') {
			displayValue = '';
		} else if (typeof value === 'number') {
			const numDisplay = parseFloat(displayValue);
			if (isNaN(numDisplay) || numDisplay !== value) {
				displayValue = value.toString();
			}
		} else {
			displayValue = String(value);
		}
	});

	let currencySymbol = $derived(
		new Intl.NumberFormat(locale, {
			style: 'currency',
			currency
		})
			.formatToParts(0)
			.find((part) => part.type === 'currency')?.value || '$'
	);

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const rawValue = target.value.replace(/[^\d.]/g, '');
		displayValue = rawValue;

		if (rawValue === '') {
			value = undefined;
			onchange?.(undefined);
			return;
		}

		const numValue = parseFloat(rawValue);
		if (!isNaN(numValue)) {
			value = numValue;
			onchange?.(numValue);
		}
	}

	function handleBlur() {
		if (displayValue && !isNaN(parseFloat(displayValue))) {
			const formatted = parseFloat(displayValue).toFixed(2);
			displayValue = formatted;
		}
	}
</script>

{#snippet currencyIcon()}
	<span class="text-ink-muted text-sm font-medium">{currencySymbol}</span>
{/snippet}

<Input
	bind:inputRef
	type="text"
	inputmode="decimal"
	value={displayValue}
	oninput={handleInput}
	onblur={handleBlur}
	{inputSize}
	icon={currencyIcon}
	iconPosition="left"
	{label}
	{error}
	{hint}
	class={className}
	{...restProps}
/>
