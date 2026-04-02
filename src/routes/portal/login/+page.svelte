<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Ingresar — Portal Paciente</title></svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
	<div class="max-w-sm w-full">
		<!-- Back link -->
		<a href="/portal" class="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
			Volver al portal
		</a>

		<!-- Card -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-2)] p-6 space-y-5">
			<div class="text-center">
				<h1 class="text-xl font-bold text-ink">Ingresar al portal</h1>
				<p class="text-sm text-ink-muted mt-1">Ingrese su cédula o número de historia médica</p>
			</div>

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<div class="space-y-4">
					<Input
						name="cedula"
						label="Cédula o NHM"
						placeholder="Ej: V-12345678 o 1001"
						value={(form as Record<string, string>)?.query ?? ''}
						error={form?.error}
						inputSize="lg"
					/>

					<Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
						Ingresar
					</Button>
				</div>
			</form>

			{#if form?.error}
				<div class="text-center">
					<a href="/portal/registro" class="text-sm text-viking-600 dark:text-viking-400 hover:underline font-medium">
						¿Es paciente nuevo? Regístrese aquí →
					</a>
				</div>
			{/if}
		</div>

		<p class="text-center text-xs text-ink-subtle mt-6">
			¿Es personal del hospital? <a href="/login" class="text-viking-600 hover:underline">Acceso interno →</a>
		</p>
	</div>
</div>
