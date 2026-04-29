<script lang="ts">
	import { slide } from 'svelte/transition';

	const faqs = [
		{
			question: 'What is ShutterLife?',
			answer:
				'ShutterLife is a free web tool that checks your camera\'s shutter count and predicts remaining life using original RAW or JPEG files.'
		},
		{
			question: 'What is Shutter Count?',
			answer:
				'It\'s the number of mechanical shutter actuations. Manufacturers define an expected lifetime for these, making it a key factor in determining your camera\'s longevity and resale value.'
		},
		{
			question: 'Are my photos uploaded to a server?',
			answer:
				'No. All processing happens locally in your browser. Your files never leave your device, ensuring complete privacy.'
		},
		{
			question: 'Which file types and cameras are supported?',
			answer:
				'We support original RAW (.arw) and JPEG files. Currently optimized for Sony Alpha series, with more brands and models being added regularly.'
		},
		{
			question: 'How should I transfer images for accurate data?',
			answer:
				'Use original, unedited files directly from your camera. Editing software or certain transfer methods often remove the embedded shutter count data.'
		},
		{
			question: 'How does the prediction work?',
			answer:
				'By comparing the shutter count and timestamps of two or more images, we calculate your average usage rate to estimate when you\'ll reach future shutter milestones.'
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
		<p class="text-muted-foreground">Everything you need to know about ShutterLife.</p>
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
