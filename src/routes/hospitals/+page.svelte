<script lang="ts">
	import Card from '$shared/components/card/Card.svelte';
	import Button from '$shared/components/button/Button.svelte';
	import Input from '$shared/components/input/Input.svelte';

	interface Hospital {
		id: string;
		name: string;
		slug: string;
		location: string;
		beds: number;
		patients: number;
		status: 'active' | 'maintenance';
	}

	const hospitals: Hospital[] = [
		{ id: 'hospital-1', name: 'General Hospital', slug: 'general-hospital', location: 'Downtown Medical District', beds: 450, patients: 312, status: 'active' },
		{ id: 'hospital-2', name: "St. Mary's Medical Center", slug: 'st-marys', location: 'Westside Campus', beds: 320, patients: 245, status: 'active' },
		{ id: 'hospital-3', name: "City Children's Hospital", slug: 'city-childrens', location: 'Pediatric Complex', beds: 180, patients: 98, status: 'active' },
		{ id: 'hospital-4', name: 'Regional Trauma Center', slug: 'regional-trauma', location: 'Emergency Services Hub', beds: 275, patients: 0, status: 'maintenance' },
	];

	let searchQuery = $state('');

	let filteredHospitals = $derived(
		hospitals.filter(
			(hospital) =>
				hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				hospital.location.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<svelte:head>
	<title>Select Hospital - Hospital Management</title>
	<meta name="description" content="Select a hospital to manage" />
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<div class="max-w-3xl mx-auto px-4 py-12">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-xl font-semibold text-slate-900">Select Hospital</h1>
			<p class="text-sm text-slate-500 mt-1">Choose a facility to access its dashboard</p>
		</div>

		<!-- Search -->
		<div class="mb-6">
			<Input
				placeholder="Search hospitals..."
				bind:value={searchQuery}
			/>
		</div>

		<!-- Hospital List -->
		<div class="space-y-2">
			{#if filteredHospitals.length === 0}
				<Card variant="default" padding="lg">
					<div class="text-center py-4">
						<p class="text-sm text-slate-500">No hospitals found</p>
						<Button variant="ghost" size="sm" class="mt-2" onclick={() => (searchQuery = '')}>
							Clear search
						</Button>
					</div>
				</Card>
			{:else}
				{#each filteredHospitals as hospital (hospital.id)}
					<a href="/{hospital.slug}" class="block group">
						<Card variant="default" padding="none" hover>
							<div class="flex items-center justify-between px-4 py-3">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3">
										<h3 class="text-sm font-medium text-slate-900 group-hover:text-viking-600 transition-colors">
											{hospital.name}
										</h3>
										{#if hospital.status === 'maintenance'}
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
												Maintenance
											</span>
										{/if}
									</div>
									<p class="text-xs text-slate-500 mt-0.5">{hospital.location}</p>
								</div>

								<div class="flex items-center gap-6 text-xs text-slate-500">
									<div class="text-right">
										<span class="text-slate-900 font-medium tabular-nums">{hospital.patients}</span>
										<span class="text-slate-400 ml-1">patients</span>
									</div>
									<div class="text-right">
										<span class="text-slate-900 font-medium tabular-nums">{hospital.beds}</span>
										<span class="text-slate-400 ml-1">beds</span>
									</div>
									<svg
										class="w-4 h-4 text-slate-300 group-hover:text-viking-500 transition-colors"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
									</svg>
								</div>
							</div>
						</Card>
					</a>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<p class="text-xs text-slate-400 text-center mt-8">
			Need access to another hospital? Contact your administrator.
		</p>
	</div>
</div>
