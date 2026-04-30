<script lang="ts">
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			question: 'What is ShutterLife?',
			answer:
				"ShutterLife is a free web tool that checks your camera's shutter count and predicts remaining life using original RAW or JPEG files."
		},
		{
			question: 'What is shutter count?',
			answer:
				"The number of mechanical shutter actuations. Manufacturers rate their shutters to a specific count — making it a key factor in longevity and resale value."
		},
		{
			question: 'Are my photos uploaded to a server?',
			answer:
				'No. All processing happens locally in your browser. Your files never leave your device.'
		},
		{
			question: 'Which file types and cameras are supported?',
			answer:
				'RAW and JPEG files from Sony, Fujifilm, Nikon, and Canon cameras. More brands are being added.'
		},
		{
			question: 'How should I transfer images for accurate data?',
			answer:
				'Use original, unedited files directly from your camera. Editing or re-saving images often strips the embedded shutter count.'
		},
		{
			question: 'How does the prediction work?',
			answer:
				"By comparing shutter counts and timestamps across 2+ images, we calculate your average daily usage rate and project when you'll hit your target."
		}
	];

	let openIndex: number | null = 0;

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<div class="border-t">
	<div class="container mx-auto px-6 py-14">
		<p class="text-muted-foreground mb-2 text-xs font-medium tracking-widest uppercase">FAQ</p>
		<h2 class="mb-8 text-2xl font-bold tracking-tight">Common questions</h2>

		<div class="max-w-2xl divide-y rounded-lg border">
			{#each faqs as faq, i}
				<div>
					<button
						class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/40"
						onclick={() => toggle(i)}
					>
						<span class="pr-4 font-medium">{faq.question}</span>
						<svg
							class="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 {openIndex === i ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if openIndex === i}
						<div transition:slide={{ duration: 200 }}>
							<div class="border-t bg-muted/20 px-5 py-4 text-sm text-muted-foreground leading-relaxed">
								{faq.answer}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
