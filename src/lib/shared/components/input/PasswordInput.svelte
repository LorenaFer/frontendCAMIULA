<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type InputSize = 'sm' | 'md' | 'lg';

	interface PasswordInputProps extends Omit<HTMLInputAttributes, 'size' | 'type'> {
		label?: string;
		error?: string;
		hint?: string;
		inputSize?: InputSize;
		showStrength?: boolean;
		inputRef?: HTMLInputElement;
	}

	let {
		showStrength = false,
		value = $bindable(),
		inputSize = 'md',
		label,
		error,
		hint,
		class: className = '',
		inputRef = $bindable(),
		...restProps
	}: PasswordInputProps = $props();

	let showPassword = $state(false);

	const sizeStyles: Record<InputSize, string> = {
		sm: 'h-8 px-2.5 text-sm',
		md: 'h-9 px-3 text-sm',
		lg: 'h-10 px-3.5 text-sm'
	};

	const baseInputClasses =
		'w-full rounded-lg border bg-surface-elevated text-ink placeholder:text-ink-subtle transition-all duration-150 focus:outline-none';

	const getStateClasses = (err?: string) =>
		err
			? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
			: 'border-border hover:border-border-strong focus:border-border-strong focus:ring-2 focus:ring-border-subtle';

	const disabledClasses =
		'disabled:bg-canvas-subtle disabled:text-ink-subtle disabled:cursor-not-allowed disabled:hover:border-border';

	function getPasswordStrength(password: string): { level: number; label: string } {
		let score = 0;
		if (password.length >= 8) score++;
		if (password.length >= 12) score++;
		if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
		if (/\d/.test(password)) score++;
		if (/[^a-zA-Z0-9]/.test(password)) score++;

		if (score <= 1) return { level: 1, label: 'Weak' };
		if (score <= 2) return { level: 2, label: 'Fair' };
		if (score <= 3) return { level: 3, label: 'Good' };
		return { level: 4, label: 'Strong' };
	}

	let strength = $derived(
		value && typeof value === 'string' ? getPasswordStrength(value) : null
	);

	const strengthColors: Record<number, string> = {
		1: 'bg-red-500',
		2: 'bg-amber-500',
		3: 'bg-emerald-400',
		4: 'bg-emerald-600'
	};

	const levels = [1, 2, 3, 4];
</script>

<div class="w-full">
	{#if label}
		<label class="block text-sm font-medium text-ink mb-1.5">
			{label}
		</label>
	{/if}
	<div class="relative">
		<input
			bind:this={inputRef}
			type={showPassword ? 'text' : 'password'}
			bind:value
			class="{baseInputClasses} {sizeStyles[inputSize]} pr-10 {getStateClasses(
				error
			)} {disabledClasses} {className}"
			{...restProps}
		/>
		<button
			type="button"
			onclick={() => (showPassword = !showPassword)}
			class="absolute top-1/2 -translate-y-1/2 right-3 text-ink-subtle hover:text-ink-muted transition-colors"
		>
			{#if showPassword}
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
						d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
					/>
				</svg>
			{:else}
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
						d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
					/>
				</svg>
			{/if}
		</button>
	</div>
	{#if showStrength && strength}
		<div class="mt-2">
			<div class="flex gap-1 mb-1">
				{#each levels as level (level)}
					<div
						class="h-1 flex-1 rounded-full transition-colors {level <= strength.level
							? strengthColors[strength.level]
							: 'bg-border'}"
					></div>
				{/each}
			</div>
			<p class="text-xs text-ink-muted">{strength.label}</p>
		</div>
	{/if}
	{#if (error || hint) && !showStrength}
		<p class="mt-1.5 text-xs {error ? 'text-red-600' : 'text-ink-muted'}">
			{error || hint}
		</p>
	{/if}
</div>
