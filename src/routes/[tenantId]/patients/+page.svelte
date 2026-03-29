<svelte:head>
	<title>Pacientes - Gestión Hospitalaria</title>
	<meta name="description" content="Gestiona expedientes e información de pacientes" />
</svelte:head>

<script lang="ts">
	import EmptyState from '$shared/components/empty-state/EmptyState.svelte';
	import SearchInput from '$shared/components/input/SearchInput.svelte';
	import Select from '$shared/components/select/Select.svelte';
	import Card from '$shared/components/card/Card.svelte';
	import CardHeader from '$shared/components/card/CardHeader.svelte';
	import CardTitle from '$shared/components/card/CardTitle.svelte';
	import CardDescription from '$shared/components/card/CardDescription.svelte';
	import CardBody from '$shared/components/card/CardBody.svelte';
	import Badge from '$shared/components/badge/Badge.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let expandedHistoryId = $state<string | null>(null);

	const searchTypeOptions = [
		{ value: 'cedula', label: 'Cédula' },
		{ value: 'nhm', label: 'Número de historia' }
	];

	const relationLabels: Record<string, string> = {
		P: 'Profesor',
		E: 'Empleado',
		O: 'Obrero',
		F: 'Familiar',
		B: 'Estudiante',
		C: 'Familiar de Estudiante',
		R: 'Familiar de Profesor',
		S: 'Familiar de Empleado',
		T: 'Familiar de Obrero',
		X: 'Caso Especial',
	};

	function relationLabel(value: string) {
		const mapped = relationLabels[value];
		if (mapped) return mapped;
		if (!value) return '';
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	function searchPlaceholder(searchType: string) {
		return searchType === 'nhm'
			? 'Ej. 100245'
			: 'Ingrese la cédula del paciente';
	}

	function formatDate(date: string) {
		if (!date) return 'Sin fecha';
		const normalized = date.length > 10 ? date.slice(0, 10) : date;
		const parsed = new Date(`${normalized}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) return normalized;
		return parsed.toLocaleDateString('es-VE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatList(items: string[] | undefined, emptyLabel: string) {
		if (!items || items.length === 0) return emptyLabel;
		return items.join(', ');
	}

	function timelineCategoryLabel(category: string) {
		if (category === 'laboratorio') return 'Laboratorio';
		if (category === 'vacunacion') return 'Prevencion';
		if (category === 'administrativo') return 'Administrativo';
		return 'Consulta';
	}

	function timelineCategoryVariant(category: string) {
		if (category === 'laboratorio') return 'primary';
		if (category === 'vacunacion') return 'warning';
		if (category === 'administrativo') return 'default';
		return 'info';
	}

	function toggleForm(entryId: string) {
		expandedHistoryId = expandedHistoryId === entryId ? null : entryId;
	}
</script>

{#snippet bloodIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 3.5c-1.45 2.8-5.5 6.27-5.5 10a5.5 5.5 0 1 0 11 0c0-3.73-4.05-7.2-5.5-10Z"
		/>
	</svg>
{/snippet}

{#snippet allergyIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M12 9v4m0 4h.01M10.29 3.86l-8.21 14.2A2 2 0 0 0 3.79 21h16.42a2 2 0 0 0 1.71-2.94l-8.21-14.2a2 2 0 0 0-3.42 0Z"
		/>
	</svg>
{/snippet}

{#snippet conditionIcon()}
	<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M3 12h3l2.5-4 4 8 2.5-4H21"
		/>
	</svg>
{/snippet}

<div class="py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-ink">Pacientes</h1>
			<p class="mt-2 text-ink-muted">Gestiona expedientes e historial médico</p>
		</div>
		<a
			href={`/${$page.params.tenantId}/patients/new`}
			class="inline-block"
			aria-label="Agregar paciente nuevo"
		>
			<Button variant="primary" size="md" class="w-full">
				Agregar paciente nuevo
			</Button>
		</a>
	</div>

	<div class="space-y-6">
		<Card variant="elevated" padding="lg">
			<CardHeader class="mb-5">
				{#snippet action()}
					<a href={`/${$page.params.tenantId}/patients`} class="inline-block">
						<Button variant="ghost" size="sm">Limpiar</Button>
					</a>
				{/snippet}
				<div>
					<CardTitle class="text-base">Buscar paciente</CardTitle>
					<CardDescription>
						Consulta por cédula o por número de historia clínica.
					</CardDescription>
				</div>
			</CardHeader>

			<CardBody>
				<form method="GET" class="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
					<Select
						name="searchType"
						label="Buscar por"
						options={searchTypeOptions}
						value={data.filters.searchType}
						selectSize="lg"
					/>
					<SearchInput
						name="query"
						label="Valor de búsqueda"
						value={data.filters.query}
						placeholder={searchPlaceholder(data.filters.searchType)}
						hint={data.validationMessage}
						inputSize="lg"
						autocomplete="off"
					/>
					<Button type="submit" variant="primary" size="lg">Buscar</Button>
				</form>
			</CardBody>
		</Card>

		<Card padding="none" variant="default">
			<div class="border-b border-border px-6 py-4">
				<h2 class="text-lg font-medium text-ink">Expedientes de pacientes</h2>
			</div>

			{#if data.patient}
				<div class="p-6">
					<div class="flex flex-col gap-4 rounded-xl border border-border bg-canvas-subtle/70 p-5 lg:flex-row lg:items-start lg:justify-between">
						<div class="space-y-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">
									Paciente encontrado
								</p>
								<h3 class="mt-1 text-2xl font-semibold text-ink">
									{data.patient.nombre} {data.patient.apellido}
								</h3>
								<p class="mt-1 text-sm text-ink-muted">
									{relationLabel(data.patient.relacion_univ)}
									{#if data.patient.edad != null}
										• {data.patient.edad} años
									{/if}
								</p>
							</div>
						</div>

						<div class="grid min-w-0 gap-3 sm:grid-cols-2 lg:w-[22rem]">
							<div class="rounded-lg border border-border bg-surface-elevated px-4 py-3">
								<p class="text-xs uppercase tracking-[0.14em] text-ink-subtle">Número de historia</p>
								<p class="mt-1 text-sm font-semibold text-ink">{data.patient.nhm}</p>
							</div>
							<div class="rounded-lg border border-border bg-surface-elevated px-4 py-3">
								<p class="text-xs uppercase tracking-[0.14em] text-ink-subtle">Cédula</p>
								<p class="mt-1 text-sm font-semibold text-ink">{data.patient.cedula}</p>
							</div>
						</div>
					</div>
				</div>
			{:else if data.searched}
				<EmptyState
					class="px-6"
					title="No se encontró ningún paciente"
					description="Verifica el valor ingresado o intenta con el otro criterio de búsqueda."
				/>
			{:else}
				<EmptyState
					class="px-6"
					title="Sin búsqueda activa"
					description="Usa la barra superior para localizar un paciente por cédula o por número de historia."
				/>
			{/if}
		</Card>

		{#if data.patient}
			<Card variant="default" padding="lg">
				<CardHeader class="mb-5">
					<div>
						<CardTitle class="text-base">Resumen de historial médico</CardTitle>
						<CardDescription>
							Vista cronológica y clínica del paciente encontrado.
						</CardDescription>
					</div>
				</CardHeader>

				<CardBody class="space-y-5">
					<div class="grid gap-4 md:grid-cols-3">
						<Card variant="ghost" padding="md" class="border border-border/60">
							<div class="space-y-2">
								<Badge variant="primary" style="soft" size="sm" icon={bloodIcon}>Tipo de sangre</Badge>
								<p class="text-2xl font-semibold text-ink">{data.medicalSnapshot?.tipoSangre ?? 'No registrado'}</p>
								<p class="text-xs text-ink-muted">Tipo sanguíneo registrado en expediente.</p>
							</div>
						</Card>
						<Card variant="ghost" padding="md" class="border border-border/60">
							<div class="space-y-2">
								<Badge variant="warning" style="soft" size="sm" icon={allergyIcon}>Alergias</Badge>
								<p class="text-lg font-semibold leading-tight text-ink">
									{formatList(data.medicalSnapshot?.alergias, 'No reporta alergias')}
								</p>
								<p class="text-xs text-ink-muted">Si presenta alergias, se muestra el detalle.</p>
							</div>
						</Card>
						<Card variant="ghost" padding="md" class="border border-border/60">
							<div class="space-y-2">
								<Badge variant="info" style="soft" size="sm" icon={conditionIcon}>Condición existente</Badge>
								<p class="text-lg font-semibold leading-tight text-ink">
									{formatList(data.medicalSnapshot?.condiciones, 'Sin condición registrada')}
								</p>
								<p class="text-xs text-ink-muted">Condiciones médicas activas registradas.</p>
							</div>
						</Card>
					</div>

					<Card variant="ghost" padding="md">
						<CardHeader class="mb-3">
							<div>
								<CardTitle class="text-sm">Línea de tiempo médica</CardTitle>
								<CardDescription>Eventos clínicos y administrativos más recientes.</CardDescription>
							</div>
						</CardHeader>
						<CardBody>
							{#if data.historyTimeline.length > 0}
								<div class="space-y-3">
									{#each data.historyTimeline as entry}
										<Card variant="flat" padding="sm" class="border border-border">
											<div class="flex flex-col gap-3">
												<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div class="space-y-1">
													<p class="text-sm font-semibold text-ink">{entry.titulo}</p>
													<p class="text-xs text-ink-muted">{entry.detalle}</p>
												</div>
												<div class="flex flex-wrap items-center gap-2">
													<Badge
														variant={timelineCategoryVariant(entry.categoria)}
														style="outline"
														size="sm"
													>{timelineCategoryLabel(entry.categoria)}</Badge>
													<Badge variant="info" style="soft" size="sm">{formatDate(entry.fecha)}</Badge>
													{#if entry.categoria === 'consulta'}
														<Button
															variant="ghost"
															size="sm"
															onclick={() => toggleForm(entry.id)}
														>
															{expandedHistoryId === entry.id ? 'Ocultar formulario' : 'Ver formulario'}
														</Button>
													{/if}
												</div>
											</div>

											{#if entry.categoria === 'consulta' && expandedHistoryId === entry.id}
												<Card variant="ghost" padding="sm" class="border border-border/60">
													<div class="grid gap-3 md:grid-cols-2">
														<div>
															<p class="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">Motivo de consulta</p>
															<p class="mt-1 text-sm text-ink">{entry.formulario?.motivoConsulta || 'No registrado'}</p>
														</div>
														<div>
															<p class="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">Anamnesis</p>
															<p class="mt-1 text-sm text-ink">{entry.formulario?.anamnesis || 'No registrada'}</p>
														</div>
														<div>
															<p class="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">Diagnóstico</p>
															<p class="mt-1 text-sm text-ink">{entry.formulario?.diagnostico || 'No registrado'}</p>
														</div>
														<div>
															<p class="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">Tratamiento</p>
															<p class="mt-1 text-sm text-ink">{entry.formulario?.tratamiento || 'No registrado'}</p>
														</div>
													</div>
													<div class="mt-3">
														<p class="text-[11px] uppercase tracking-[0.14em] text-ink-subtle">Indicaciones</p>
														<p class="mt-1 text-sm text-ink">{entry.formulario?.indicaciones || 'No registradas'}</p>
													</div>
												</Card>
											{/if}
										</Card>
									{/each}
								</div>
							{:else}
								<EmptyState
									title="Sin registros clínicos"
									description="Este paciente aún no tiene eventos en su historial médico."
								/>
							{/if}
						</CardBody>
					</Card>

					<Card variant="ghost" padding="md">
						<CardHeader class="mb-3">
							<div>
								<CardTitle class="text-sm">Medicamentos entregados por farmacia</CardTitle>
								<CardDescription>
									Historial de entregas y dosis registradas para este paciente.
								</CardDescription>
							</div>
						</CardHeader>
						<CardBody>
							{#if data.pharmacyDeliveries.length > 0}
								<div class="space-y-3">
									{#each data.pharmacyDeliveries as delivery}
										<Card variant="flat" padding="sm" class="border border-border">
											<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
												<div class="space-y-1">
													<p class="text-sm font-semibold text-ink">{delivery.medicamento}</p>
													<p class="text-xs text-ink-muted">
														{delivery.dosis} • {delivery.cantidad}
													</p>
												</div>
												<div class="flex flex-wrap items-center gap-2">
													<Badge
														variant={delivery.estado === 'entregado' ? 'success' : 'warning'}
														style="soft"
														size="sm"
													>
														{delivery.estado === 'entregado' ? 'Entregado' : 'Pendiente'}
													</Badge>
													<Badge variant="default" style="outline" size="sm">{formatDate(delivery.fecha)}</Badge>
												</div>
											</div>
										</Card>
									{/each}
								</div>
							{:else}
								<EmptyState
									title="Sin entregas de farmacia"
									description="Aún no hay medicamentos registrados como entregados para este paciente."
								/>
							{/if}
						</CardBody>
					</Card>
				</CardBody>
			</Card>
		{/if}
	</div>
</div>
