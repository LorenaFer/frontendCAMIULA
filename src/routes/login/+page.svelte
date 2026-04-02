<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Acceso Personal — CAMIULA</title></svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
	<div class="max-w-sm w-full">
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-2)] p-6 space-y-5">
			<div class="text-center">
				<div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-viking-600 mb-3">
					<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
					</svg>
				</div>
				<h1 class="text-xl font-bold text-ink">Acceso Personal</h1>
				<p class="text-sm text-ink-muted mt-1">Servicio Médico Universitario — CAMIULA</p>
			</div>

			{#if form?.error}
				<div class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<div class="space-y-4">
					<Input
						name="username"
						label="Usuario"
						placeholder="nombre.apellido"
						value={form?.username ?? ''}
						inputSize="lg"
					/>

					<Input
						name="password"
						label="Contraseña"
						type="password"
						placeholder="••••••••"
						inputSize="lg"
					/>

					<Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
						Iniciar sesión
					</Button>
				</div>
			</form>
		</div>

		<p class="text-center text-xs text-ink-subtle mt-6">
			¿Es paciente? <a href="/portal" class="text-viking-600 hover:underline font-medium">Portal del paciente →</a>
		</p>
	</div>
</div>
