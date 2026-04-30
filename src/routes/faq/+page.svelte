<script lang="ts">
	import FAQ from '$lib/components/faq.svelte';
</script>

<svelte:head>
	<title>FAQ | ShutterLife — Camera Shutter Count Checker</title>
	<meta name="description" content="Frequently asked questions about ShutterLife: how to check camera shutter count, supported cameras (Sony, Nikon, Canon, Fujifilm), privacy, and how shutter life prediction works." />
	<link rel="canonical" href="https://yenjo.github.io/ShutterLife/faq" />
	<meta property="og:title" content="FAQ | ShutterLife — Camera Shutter Count Checker" />
	<meta property="og:description" content="How does ShutterLife check shutter count? Which cameras are supported? Is my data private? Find answers here." />
	<meta property="og:url" content="https://yenjo.github.io/ShutterLife/faq" />
	<script type="application/ld+json">
	{
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{
				"@type": "Question",
				"name": "What is ShutterLife?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "ShutterLife is a free web tool that checks your camera's shutter count and predicts remaining life using original RAW or JPEG files."
				}
			},
			{
				"@type": "Question",
				"name": "What is shutter count?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "The number of mechanical shutter actuations. Manufacturers rate their shutters to a specific count — making it a key factor in longevity and resale value."
				}
			},
			{
				"@type": "Question",
				"name": "Are my photos uploaded to a server?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "No. All processing happens locally in your browser. Your files never leave your device."
				}
			},
			{
				"@type": "Question",
				"name": "Which file types and cameras are supported?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "RAW and JPEG files from Sony, Fujifilm, Nikon, and Canon cameras. More brands are being added."
				}
			},
			{
				"@type": "Question",
				"name": "How does the shutter life prediction work?",
				"acceptedAnswer": {
					"@type": "Answer",
					"text": "By comparing shutter counts and timestamps across 2 or more images, ShutterLife calculates your average daily usage rate and projects when you'll hit your target shutter count."
				}
			}
		]
	}
	</script>
</svelte:head>

<div class="py-12">
	<FAQ />
</div>
