<script lang="ts">
	import FileUploader from '$lib/components/file-uploader.svelte';
	import FAQ from '$lib/components/faq.svelte';
	import { extractSonyShutterCount } from '$lib/extract';
	import { fade, slide } from 'svelte/transition';
	import { baseRoutes, supportedBrands } from '$lib/utils';
	import { base } from '$app/paths';
	import { sonyModels } from '$lib/constants';

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
		{ label: '50,000', value: 50000 },
		{ label: '100,000', value: 100000 },
		{ label: '200,000', value: 200000 },
		{ label: '300,000', value: 300000 },
		{ label: '400,000', value: 400000 },
		{ label: '500,000', value: 500000 },
		{ label: '600,000', value: 600000 },
		{ label: '700,000', value: 700000 },
		{ label: '800,000', value: 800000 },
		{ label: '1,000,000', value: 1000000 }
	];

	async function handleFilesSelected(images: { file: File; url: string }[]) {
		selectedImages = images;
		const extracted = await Promise.all(
			images.map(async (img) => {
				const result = await extractSonyShutterCount(img.file);
				return { ...result, url: img.url, fileName: img.file.name };
			})
		);

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
		if (diff <= 0) return 'Goal reached';

		const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
		const years = Math.floor(totalDays / 365);
		const months = Math.floor((totalDays % 365) / 30);
		const days = (totalDays % 365) % 30;

		const parts = [];
		if (years > 0) parts.push(`${years}y`);
		if (months > 0) parts.push(`${months}mo`);
		if (days > 0 || parts.length === 0) parts.push(`${days}d`);

		return `${parts.join(' ')} · ${totalDays.toLocaleString()} days`;
	}

	$: if (targetShutterCount) calculatePrediction();
</script>

<svelte:head>
	<title>ShutterLife — Camera Shutter Count Checker & Life Predictor</title>
	<meta
		name="description"
		content="Free online tool to check your camera's shutter count and predict remaining shutter life. Upload a photo from your Sony, Nikon, Canon, or Fujifilm camera to instantly read shutter actuations from EXIF metadata — no upload to server, 100% private."
	/>
	<meta name="keywords" content="shutter count checker, camera shutter life, shutter actuations, shutter count from photo, Sony shutter count, Nikon shutter count, Canon shutter count, Fujifilm shutter count, camera shutter life predictor, EXIF shutter count, 셔터 수명, 셔터 카운트 확인, 카메라 수명 계산" />
	<link rel="canonical" href="https://yenjo.github.io/ShutterLife/" />
	<meta property="og:title" content="ShutterLife — Camera Shutter Count Checker & Life Predictor" />
	<meta property="og:description" content="Check your camera's shutter count and predict when you'll hit the limit. Free, private, works entirely in your browser. Supports Sony, Nikon, Canon, Fujifilm." />
	<meta property="og:url" content="https://yenjo.github.io/ShutterLife/" />
	<meta property="og:image" content="https://yenjo.github.io/ShutterLife/og-image.png" />
	<meta name="twitter:title" content="ShutterLife — Camera Shutter Count Checker & Life Predictor" />
	<meta name="twitter:description" content="Check your camera's shutter count and predict remaining life. Free, private, in-browser. Supports Sony, Nikon, Canon, Fujifilm." />
	<meta name="twitter:image" content="https://yenjo.github.io/ShutterLife/og-image.png" />
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "ShutterLife",
		"description": "Free online tool to check your camera's shutter count and predict remaining shutter life from photo EXIF metadata. Supports Sony, Nikon, Canon, and Fujifilm cameras.",
		"applicationCategory": "PhotographyApplication",
		"operatingSystem": "Web",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"url": "https://yenjo.github.io/ShutterLife/",
		"author": {
			"@type": "Person",
			"name": "yenjo"
		},
		"featureList": [
			"Read shutter count from EXIF metadata",
			"Predict remaining shutter life",
			"Works entirely in browser — no server upload",
			"Supports Sony, Nikon, Canon, Fujifilm",
			"Supports RAW and JPEG files"
		]
	}
	</script>
</svelte:head>

<!-- Hero -->
<div class="border-b">
	<div class="container mx-auto px-6 py-12 md:py-16">
		<div class="max-w-2xl">
			<p class="text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase">Shutter count predictor</p>
			<h1 class="text-4xl font-bold tracking-tight md:text-5xl">
				How long will your<br />shutter last?
			</h1>
			<p class="text-muted-foreground mt-4 text-base leading-relaxed">
				Upload 2+ images from your camera. ShutterLife reads the embedded shutter count
				and timestamp to estimate when you'll hit your limit.
			</p>
		</div>
	</div>
</div>

<!-- Main tool -->
<div class="container mx-auto px-6 py-10">
	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Left: upload -->
		<div class="flex flex-col gap-5">
			<FileUploader
				bind:selectedImages
				{imageDataList}
				className="min-h-[240px] lg:min-h-[320px]"
				onFilesSelected={handleFilesSelected}
				onFilesRemoved={handleFilesRemoved}
			/>
		</div>

		<!-- Right: prediction -->
		<div class="flex flex-col gap-6">
			<!-- Target setting -->
			<div>
				<label for="target" class="text-muted-foreground mb-2 block text-xs font-medium tracking-widest uppercase">
					Shutter target
				</label>
				<select
					id="target"
					bind:value={targetShutterCount}
					class="border-input bg-background h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
				>
					{#each targetOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<!-- Result -->
			<div class="flex-1 rounded-lg border">
				{#if predictionDate}
					<div in:fade class="flex h-full flex-col p-8">
						<p class="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">Predicted date</p>
						<p class="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
							{predictionDate.toLocaleDateString(undefined, {
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							})}
						</p>

						<div class="mt-6 space-y-4">
							<div class="bg-muted/50 rounded-md px-4 py-3">
								<p class="text-muted-foreground text-xs">Time remaining</p>
								<p class="mt-0.5 font-mono font-semibold">{formatRemainingTime(predictionDate)}</p>
							</div>
							{#if dailyAverage}
								<div class="bg-muted/50 rounded-md px-4 py-3">
									<p class="text-muted-foreground text-xs">Daily average</p>
									<p class="mt-0.5 font-mono font-semibold">{Math.round(dailyAverage).toLocaleString()} shots/day</p>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="flex h-full min-h-[240px] flex-col items-center justify-center p-8 text-center">
						<div class="text-muted-foreground/30 mb-4">
							<svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<p class="text-muted-foreground text-sm">
							{imageDataList.length < 2 ? 'Upload 2 or more images to see prediction' : 'Unable to calculate — check that images have valid metadata'}
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Supported cameras -->
<div class="border-t">
	<div class="container mx-auto px-6 py-14">
		<p class="text-muted-foreground mb-2 text-xs font-medium tracking-widest uppercase">Compatibility</p>
		<h2 class="mb-8 text-2xl font-bold tracking-tight">Supported cameras</h2>

		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each supportedBrands as brand}
				<div class="rounded-lg border overflow-hidden">
					<button
						class="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
						onclick={() => (expandedBrand = expandedBrand === brand.path ? null : brand.path)}
					>
						<span class="font-semibold">{brand.name}</span>
						<svg
							class="text-muted-foreground h-4 w-4 transition-transform duration-200 {expandedBrand === brand.path ? 'rotate-180' : ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if expandedBrand === brand.path}
						<div transition:slide={{ duration: 200 }} class="border-t bg-muted/20 px-5 py-4 text-sm">
							{#if brand.path === 'sony'}
								<div class="grid grid-cols-2 gap-1.5 md:grid-cols-3">
									{#each Object.values(sonyModels) as model}
										<span class="text-muted-foreground text-xs">{model.name}</span>
									{/each}
								</div>
								<div class="mt-4 pt-4 border-t">
									<a
										href="{base}{baseRoutes.supportedDevices}/{brand.path}"
										class="text-sm font-medium hover:underline inline-flex items-center gap-1"
									>
										Full list
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
										</svg>
									</a>
								</div>
							{:else if brand.path === 'fujifilm'}
								<p class="text-muted-foreground leading-relaxed">X-series, GFX and most modern Fujifilm cameras. Supports JPEG and RAF files.</p>
							{:else if brand.path === 'nikon'}
								<p class="text-muted-foreground leading-relaxed">DSLRs and Z-series mirrorless. Supports JPEG and NEF files.</p>
							{:else if brand.path === 'canon'}
								<p class="text-muted-foreground leading-relaxed">Most EOS DSLRs and mirrorless. Supports JPEG, CR2 and CR3 files. Some CR3 not available.</p>
							{:else}
								<p class="text-muted-foreground italic">Not Available</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}

			{#each ['Olympus', 'Panasonic', 'Leica', 'Licoh', 'Pentax', 'Sigma'] as brandName}
				<div class="rounded-lg border border-dashed px-5 py-4 opacity-40 pointer-events-none">
					<div class="flex items-center justify-between">
						<span class="font-semibold">{brandName}</span>
						<span class="text-muted-foreground text-xs">Not Available</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<FAQ />
