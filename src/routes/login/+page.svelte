<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<svelte:head>
	<title>Iniciar Sesión — Servicio Médico</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-canvas px-4">
	<div class="w-full max-w-sm">
		<!-- Header -->
		<div class="text-center mb-6">
			<div class="w-12 h-12 rounded-xl bg-viking-600 flex items-center justify-center mx-auto mb-3">
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<h1 class="text-xl font-bold text-ink">Servicio Médico Universitario</h1>
			<p class="text-xs text-ink-muted mt-1">Seleccione su perfil para continuar</p>
		</div>

		<!-- Role cards -->
		<div class="space-y-2">
			{#each [
				{ role: 'paciente', label: 'Paciente', desc: 'Agendar y gestionar mis citas', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z', color: 'emerald' },
				{ role: 'analista', label: 'Analista', desc: 'Gestión de citas, pacientes y reportes', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z', color: 'blue' },
				{ role: 'doctor', label: 'Doctor', desc: 'Mis citas, disponibilidad y evaluaciones', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z', color: 'violet' },
				{ role: 'admin', label: 'Administrador', desc: 'Acceso completo al sistema', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', color: 'amber' }
			] as { role, label, desc, icon, color }}
				<form method="POST" action="?/login" use:enhance>
					<input type="hidden" name="role" value={role} />
					<button type="submit" class="w-full text-left group">
						<div class="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-surface-elevated hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
							<div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 {
								color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
								color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
								color === 'violet' ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600' :
								'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
							}">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d={icon} />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-ink">{label}</p>
								<p class="text-[11px] text-ink-muted">{desc}</p>
							</div>
							<svg class="w-4 h-4 text-ink-subtle group-hover:text-ink-muted transition-colors shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
							</svg>
						</div>
					</button>
				</form>
			{/each}
		</div>

		<p class="text-center text-[10px] text-ink-subtle mt-5">
			Modo desarrollo — sin autenticación real
		</p>
	</div>
</div>
