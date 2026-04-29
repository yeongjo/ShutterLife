<script lang="ts">
	import FileUploader from '$lib/components/file-uploader.svelte';
	import FAQ from '$lib/components/faq.svelte';
	import { extractSonyShutterCount } from '$lib/extract';
	import { fade, slide } from 'svelte/transition';
	import { baseRoutes, supportedBrands } from '$lib/utils';
	import { base } from '$app/paths';
	import { sonyModels } from '$lib/constants';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu';

	let selectedImages: { file: File; url: string }[] = [];
	let imageDataList: {
		shutterCount: number | null;
		cameraModel: string | null;
		date: Date | null;
		url: string;
		fileName: string;
	}[] = [];
	let targetShutterCount = 200000;
	let predictionDate: Date | null = null;
	let dailyAverage: number | null = null;
	let expandedBrand: string | null = null;

	const targetOptions = [
		{ label: '50,000 (5만)', value: 50000 },
		{ label: '100,000 (10만)', value: 100000 },
		{ label: '200,000 (20만)', value: 200000 },
		{ label: '300,000 (30만)', value: 300000 },
		{ label: '400,000 (40만)', value: 400000 },
		{ label: '500,000 (50만)', value: 500000 },
		{ label: '600,000 (60만)', value: 600000 },
		{ label: '700,000 (70만)', value: 700000 },
		{ label: '800,000 (80만)', value: 800000 },
		{ label: '1,000,000 (100만)', value: 1000000 }
	];

	async function handleFilesSelected(images: { file: File; url: string }[]) {
		selectedImages = images;
		const extracted = await Promise.all(
			images.map(async (img) => {
				const result = await extractSonyShutterCount(img.file);
				return { ...result, url: img.url, fileName: img.file.name };
			})
		);

		// Sort by date automatically so the list and calculation are consistent
		imageDataList = extracted.sort((a, b) => {
			if (!a.date) return 1;
			if (!b.date) return -1;
			return a.date.getTime() - b.date.getTime();
		});

		calculatePrediction();
	}

	function handleFilesRemoved() {
		selectedImages = [];
		imageDataList = [];
		predictionDate = null;
		dailyAverage = null;
	}

	function calculatePrediction() {
		const validData = imageDataList.filter(
			(d) => d.shutterCount !== null && d.date !== null && !isNaN(d.date.getTime())
		);

		if (validData.length < 2) {
			predictionDate = null;
			dailyAverage = null;
			return;
		}

		// validData is already sorted because imageDataList is sorted
		const earliest = validData[0];
		const latest = validData[validData.length - 1];

		const shutterDiff = latest.shutterCount! - earliest.shutterCount!;
		const timeDiff = latest.date!.getTime() - earliest.date!.getTime();
		const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

		if (daysDiff <= 0 || shutterDiff <= 0) {
			predictionDate = null;
			dailyAverage = null;
			return;
		}

		dailyAverage = shutterDiff / daysDiff;
		const remainingShutter = targetShutterCount - latest.shutterCount!;

		if (remainingShutter <= 0) {
			predictionDate = latest.date;
			return;
		}

		const daysToTarget = remainingShutter / dailyAverage;
		const targetTime = latest.date!.getTime() + daysToTarget * 24 * 60 * 60 * 1000;

		const resultDate = new Date(targetTime);
		if (isNaN(resultDate.getTime())) {
			predictionDate = null;
		} else {
			predictionDate = resultDate;
		}
	}

	function formatRemainingTime(targetDate: Date | null) {
		if (!targetDate) return '';
		const now = new Date();
		const diff = targetDate.getTime() - now.getTime();
		if (diff <= 0) return 'Goal reached!';

		const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
		const years = Math.floor(totalDays / 365);
		const months = Math.floor((totalDays % 365) / 30);
		const days = (totalDays % 365) % 30;

		const parts = [];
		if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
		if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
		if (days > 0 || parts.length === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

		return `${parts.join(' ')} (${totalDays.toLocaleString()} days)`;
	}

	$: if (targetShutterCount) calculatePrediction();
</script>

<svelte:head>
	<title>ShutterLife - Predict your shutter life</title>
	<meta
		name="description"
		content="Calculate and predict when your camera will reach its shutter life limit."
	/>
</svelte:head>

<div
	class="container mx-auto flex min-h-[calc(100vh-theme(spacing.24))] flex-col gap-8 p-8 lg:flex-row"
>
	<div class="flex flex-col gap-6 lg:w-1/2">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight">Upload Images</h1>
			<p class="text-muted-foreground">
				Upload 2 or more images (RAW or JPEG) to calculate your daily usage and predict shutter life.
			</p>
		</div>

		<FileUploader
			bind:selectedImages
			{imageDataList}
			className="min-h-[200px] lg:min-h-[300px]"
			onFilesSelected={handleFilesSelected}
			onFilesRemoved={handleFilesRemoved}
		/>


	</div>

	<div class="flex flex-col gap-8 lg:w-1/2">
		<div class="bg-card rounded-2xl border p-8 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
			<div class="mb-8 space-y-4">
				<h2 class="text-2xl font-bold">Prediction Settings</h2>
				<div class="space-y-2">
					<label for="target" class="text-sm leading-none font-medium">Target Shutter Count</label>
					<select
						id="target"
						bind:value={targetShutterCount}
						class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-12 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#each targetOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="space-y-6">
				<div class="text-center">
					<h3 class="text-muted-foreground text-sm font-medium tracking-wider uppercase">
						Predicted Goal Reach Date
					</h3>
					<div class="mt-2 flex h-24 items-center justify-center">
						{#if predictionDate}
							<div in:fade class="space-y-2">
								<p class="text-primary text-4xl font-extrabold tracking-tight lg:text-5xl">
									{predictionDate.toLocaleDateString(undefined, {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</p>
								{#if dailyAverage}
									<p class="text-muted-foreground text-sm">
										Based on your average of <span class="text-foreground font-bold"
											>{Math.round(dailyAverage)}</span
										> shots per day
									</p>
								{/if}
							</div>
						{:else}
							<p class="text-muted-foreground text-lg italic">
								{imageDataList.length < 2
									? 'Upload 2+ images to see prediction'
									: 'Unable to calculate'}
							</p>
						{/if}
					</div>
				</div>

				{#if predictionDate}
					<div class="bg-primary/5 border-primary/10 rounded-xl border p-6">
						<div class="flex items-center gap-4">
							<div
								class="bg-primary/20 text-primary flex h-12 w-12 items-center justify-center rounded-full"
							>
								<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div>
								<p class="text-sm font-medium">Estimated remaining time</p>
								<p class="text-2xl font-bold">
									{formatRemainingTime(predictionDate)}
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

	</div>
</div>

<div class="container mx-auto mb-16 px-8">
	<div class="space-y-8">
		<div class="text-center">
			<h2 class="text-3xl font-bold tracking-tight">Supported Devices</h2>
			<p class="text-muted-foreground mt-2">
				Check if your camera is supported. More brands coming soon.
			</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each supportedBrands as brand}
				<div class="bg-card group overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-md">
					<button
						class="flex w-full items-center justify-between p-6 text-left"
						onclick={() => (expandedBrand = expandedBrand === brand.path ? null : brand.path)}
					>
						<span class="text-xl font-bold">{brand.name}</span>
						<svg
							class="h-5 w-5 transition-transform duration-200 {expandedBrand === brand.path ? 'rotate-180' : ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if expandedBrand === brand.path}
						<div transition:slide={{ duration: 300 }} class="border-t bg-muted/30 px-6 py-4">
							{#if brand.path === 'sony'}
								<div class="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
									{#each Object.values(sonyModels) as model}
										<div class="text-muted-foreground hover:text-foreground transition-colors">
											{model.name}
										</div>
									{/each}
								</div>
								<div class="mt-4 pt-4 border-t">
									<a
										href="{base}{baseRoutes.supportedDevices}/{brand.path}"
										class="text-primary hover:underline text-sm font-semibold inline-flex items-center gap-1"
									>
										View detailed list
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</a>
								</div>
							{:else}
								<p class="text-muted-foreground text-sm italic">Coming soon...</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}

			<!-- Placeholder brands -->
			{#each ['Canon', 'Nikon', 'Fujifilm'] as brandName}
				<div class="bg-card/50 pointer-events-none rounded-2xl border border-dashed p-6 opacity-50">
					<div class="flex items-center justify-between">
						<span class="text-xl font-bold">{brandName}</span>
						<span class="bg-muted rounded-full px-3 py-1 text-xs font-medium">Coming soon</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<FAQ />

