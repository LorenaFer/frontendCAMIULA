<svelte:head><title>Portal Paciente — CAMIULA</title></svelte:head>

<div class="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
	<div class="max-w-lg w-full space-y-8 text-center">
		<!-- Logo / Branding -->
		<div>
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-viking-600 mb-4">
				<svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-ink">Servicio Médico Universitario</h1>
			<p class="text-sm text-ink-muted mt-1">CAMIULA — Portal del Paciente</p>
		</div>

		<!-- Opciones principales -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<!-- Ya tengo expediente -->
			<a
				href="/portal/login"
				class="bg-surface-elevated border border-border/60 rounded-xl p-6 hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 transition-all text-left group"
			>
				<div class="w-12 h-12 rounded-xl bg-viking-50 dark:bg-viking-900/20 flex items-center justify-center mb-4 group-hover:bg-viking-100 dark:group-hover:bg-viking-900/30 transition-colors">
					<svg class="w-6 h-6 text-viking-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
					</svg>
				</div>
				<h2 class="text-lg font-semibold text-ink mb-1">Ya tengo expediente</h2>
				<p class="text-sm text-ink-muted">Ingrese con su cédula para ver sus citas y agendar nuevas consultas.</p>
			</a>

			<!-- Soy nuevo -->
			<a
				href="/portal/registro"
				class="bg-surface-elevated border border-border/60 rounded-xl p-6 hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5 transition-all text-left group"
			>
				<div class="w-12 h-12 rounded-xl bg-sage-50 dark:bg-sage-900/20 flex items-center justify-center mb-4 group-hover:bg-sage-100 dark:group-hover:bg-sage-900/30 transition-colors">
					<svg class="w-6 h-6 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
					</svg>
				</div>
				<h2 class="text-lg font-semibold text-ink mb-1">Soy paciente nuevo</h2>
				<p class="text-sm text-ink-muted">Regístrese para crear su expediente y agendar su primera cita médica.</p>
			</a>
		</div>

		<!-- Separator -->
		<div class="flex items-center gap-3">
			<div class="h-px flex-1 bg-border/40"></div>
			<span class="text-xs text-ink-subtle">¿Es personal del hospital?</span>
			<div class="h-px flex-1 bg-border/40"></div>
		</div>

		<!-- Staff access link -->
		<a href="/login" class="text-sm text-viking-600 dark:text-viking-400 hover:underline font-medium">
			Acceso interno para personal →
		</a>

		<!-- Footer -->
		<p class="text-xs text-ink-subtle">
			Lun–Vie 8:00–5:00 PM · ¿Ayuda? Contacte la línea interna
		</p>
	</div>
</div>
