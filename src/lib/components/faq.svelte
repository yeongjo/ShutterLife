<script lang="ts">
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			question: 'How does the prediction work?',
			answer:
				'We extract the exact shutter count and timestamp from your uploaded image files. By comparing two or more points in time, we calculate your average daily shooting frequency. We then use linear extrapolation to estimate the date when your camera will reach your selected target shutter count.'
		},
		{
			question: 'Which camera models are supported?',
			answer:
				'Currently, we provide optimized support for Sony Alpha series cameras (RAW and JPEG). We are working on adding support for other manufacturers like Canon, Nikon, and Fujifilm in the future.'
		},
		{
			question: 'Is my data safe?',
			answer:
				'Yes. All image processing and EXIF extraction happen locally in your browser. Your photos are never uploaded to any server, ensuring complete privacy.'
		},
		{
			question: 'How accurate is the estimated date?',
			answer:
				'The accuracy depends on how representative your uploaded images are of your typical usage. For the most accurate prediction, upload images spanning a longer period (e.g., several months apart).'
		}
	];

	let openIndex: number | null = 0;

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="mt-16 w-full max-w-4xl mx-auto px-4 pb-24">
	<div class="text-center mb-12">
		<h2 class="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
		<p class="text-muted-foreground">Everything you need to know about Shuttersnap.</p>
	</div>

	<div class="space-y-4">
		{#each faqs as faq, i}
			<div class="border rounded-2xl overflow-hidden bg-card transition-all {openIndex === i ? 'ring-1 ring-primary/20 shadow-md' : 'hover:bg-muted/30'}">
				<button
					class="w-full px-6 py-5 text-left flex justify-between items-center gap-4 transition-colors"
					onclick={() => toggle(i)}
				>
					<span class="font-semibold text-lg">{faq.question}</span>
					<svg
						class="w-5 h-5 transition-transform duration-300 {openIndex === i ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				
				{#if openIndex === i}
					<div transition:slide={{ duration: 300 }}>
						<div class="px-6 pb-6 text-muted-foreground leading-relaxed">
							{faq.answer}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
