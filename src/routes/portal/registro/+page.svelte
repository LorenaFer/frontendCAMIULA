<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head><title>Registro — Portal Paciente</title></svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
	<div class="max-w-md w-full">
		<!-- Back link -->
		<a href="/portal" class="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-6 transition-colors">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
			Volver al portal
		</a>

		<!-- Card -->
		<div class="bg-surface-elevated border border-border/60 rounded-xl shadow-[var(--shadow-2)] p-6 space-y-5">
			<div class="text-center">
				<h1 class="text-xl font-bold text-ink">Registro de paciente</h1>
				<p class="text-sm text-ink-muted mt-1">Complete sus datos para crear su expediente médico</p>
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
					<div class="grid grid-cols-2 gap-3">
						<Input name="nombre" label="Nombres *" placeholder="Pedro" inputSize="lg" />
						<Input name="apellido" label="Apellidos *" placeholder="González" inputSize="lg" />
					</div>

					<Input name="cedula" label="Cédula de identidad *" placeholder="V-12345678" inputSize="lg" />

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium text-ink mb-1.5">Sexo</label>
							<div class="flex gap-3">
								{#each [['M', 'Masculino'], ['F', 'Femenino']] as [val, lbl]}
									<label class="flex items-center gap-2 text-sm text-ink cursor-pointer px-3 py-2 rounded-lg border border-border/60 hover:bg-canvas-subtle flex-1 justify-center">
										<input type="radio" name="sexo" value={val} class="accent-viking-600 w-4 h-4" />
										{lbl}
									</label>
								{/each}
							</div>
						</div>
						<Input name="telefono" label="Teléfono" placeholder="0412-XXXXXXX" inputSize="lg" />
					</div>

					<div>
						<label class="block text-sm font-medium text-ink mb-1.5">Relación con la universidad *</label>
						<div class="grid grid-cols-2 gap-2">
							{#each [['empleado', 'Empleado/a'], ['estudiante', 'Estudiante'], ['profesor', 'Profesor/a'], ['tercero', 'Externo/Familiar']] as [val, lbl]}
								<label class="flex items-center gap-2 text-sm text-ink cursor-pointer px-3 py-2.5 rounded-lg border border-border/60 hover:bg-canvas-subtle transition-colors">
									<input type="radio" name="relacion_univ" value={val} class="accent-viking-600 w-4 h-4" />
									{lbl}
								</label>
							{/each}
						</div>
					</div>

					<Button type="submit" variant="primary" size="lg" fullWidth isLoading={loading}>
						Registrarme
					</Button>
				</div>
			</form>

			<p class="text-center text-xs text-ink-subtle">
				Después del registro podrá agendar su primera cita médica.
			</p>
		</div>

		<p class="text-center text-xs text-ink-subtle mt-6">
			¿Ya tiene expediente? <a href="/portal/login" class="text-viking-600 hover:underline">Ingresar con cédula →</a>
		</p>
	</div>
</div>
