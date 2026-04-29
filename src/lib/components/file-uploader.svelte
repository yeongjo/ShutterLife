<script lang="ts">
	import { onMount } from 'svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	export let selectedImages: { file: File; url: string }[] = [];
	export let placeholder: string = 'Click Here or Drag and Drop your Images (2-3 recommended)';
	export let className: string = '';
	export let onFilesSelected: ((files: { file: File; url: string }[]) => void) | undefined =
		undefined;
	export let onFilesRemoved: (() => void) | undefined = undefined;

	let isDragOver = false;
	let fileInput: HTMLInputElement;
	let dcraw:
		| ((buffer: Uint8Array, options?: { extractThumbnail?: boolean }) => Uint8Array)
		| undefined;
	let isProcessing = false;
	const supportedExtensions = [
		'.arw',
		'.srf',
		'.sr2',
		'.cr2',
		'.cr3',
		'.nef',
		'.nrw',
		'.raf',
		'.rw2',
		'.jpg',
		'.jpeg'
	];

	onMount(async () => {
		const script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/dcraw';
		script.onload = () => {
			dcraw = (window as unknown as { dcraw: typeof dcraw }).dcraw;
		};
		document.head.appendChild(script);
	});

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			processFiles(files);
		}
	}

	function handleClick() {
		fileInput?.click();
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			processFiles(files);
		}
	}

	function isSupportedFile(fileName: string): boolean {
		const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
		return supportedExtensions.includes(extension);
	}

	async function processFiles(files: FileList | File[]) {
		isProcessing = true;
		const newImages: { file: File; url: string }[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!isSupportedFile(file.name)) continue;

			try {
				const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
				if (extension === '.jpg' || extension === '.jpeg') {
					const url = URL.createObjectURL(file);
					newImages.push({ file, url });
					continue;
				}

				if (!dcraw) {
					// Wait a bit for dcraw to load if it's not ready
					await new Promise((resolve) => setTimeout(resolve, 500));
					if (!dcraw) continue;
				}

				const arrayBuffer = await file.arrayBuffer();
				const buf = new Uint8Array(arrayBuffer);
				const thumbnail = dcraw(buf, { extractThumbnail: true });
				const blob = new Blob([thumbnail], { type: 'image/jpeg' });
				const url = URL.createObjectURL(blob);

				newImages.push({ file, url });
			} catch (error) {
				console.error('Error processing file:', file.name, error);
			}
		}

		selectedImages = [...selectedImages, ...newImages];
		isProcessing = false;
		onFilesSelected?.(selectedImages);
	}

	function removeImage(index: number) {
		const removed = selectedImages.splice(index, 1)[0];
		if (removed && removed.url.startsWith('blob:')) {
			URL.revokeObjectURL(removed.url);
		}
		selectedImages = [...selectedImages];
		if (selectedImages.length === 0) {
			if (fileInput) fileInput.value = '';
			onFilesRemoved?.();
		} else {
			onFilesSelected?.(selectedImages);
		}
	}

	import { onDestroy } from 'svelte';
	onDestroy(() => {
		selectedImages.forEach((img) => {
			if (img.url.startsWith('blob:')) {
				URL.revokeObjectURL(img.url);
			}
		});
	});
</script>

<div
	class="border-ring relative w-full overflow-hidden rounded-lg border-3 border-dashed {isDragOver
		? 'bg-muted/50'
		: ''} {className}"
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	on:click={handleClick}
	role="button"
	tabindex="0"
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleClick() : null)}
>
	{#if isProcessing}
		<div class="flex min-h-[200px] w-full items-center justify-center rounded-lg bg-black/20">
			<div class="text-center">
				<div class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
				<div class="text-sm text-white">Processing files...</div>
			</div>
		</div>
	{:else if selectedImages.length > 0}
		<div class="flex flex-wrap gap-2 overflow-auto p-4">
			{#each selectedImages as img, i (img.url)}
				<div class="group bg-muted relative h-24 w-24 rounded-md border shadow-sm lg:h-32 lg:w-32">
					<img src={img.url} alt="Preview" class="h-full w-full rounded-md object-cover" />
					<button
						on:click|stopPropagation={() => removeImage(i)}
						class="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
						aria-label="Remove image"
					>
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			{/each}
			<div
				class="bg-muted/50 hover:bg-muted flex h-24 w-24 items-center justify-center rounded-md border border-dashed transition-colors lg:h-32 lg:w-32"
			>
				<svg
					class="text-muted-foreground h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</div>
		</div>
	{:else}
		<div
			class="flex min-h-[200px] w-full cursor-pointer items-center justify-center p-4 text-center"
		>
			{placeholder}
		</div>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		multiple
		accept={supportedExtensions.join(',')}
		class="hidden"
		on:change={handleFileInput}
	/>
</div>
