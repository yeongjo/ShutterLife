<svelte:head>
	<title>About | ShutterLife</title>
	<meta
		name="description"
		content="Learn more about ShutterLife, the easiest way to check your Sony camera's shutter count."
	/>
</svelte:head>

<div
	class="bg-background text-foreground flex min-h-[80vh] flex-col items-center justify-center px-4 py-16"
>
	<div class="w-full max-w-4xl space-y-12">
		<div class="text-center space-y-4">
			<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
				About <span class="text-primary">ShutterLife</span>
			</h1>
			<p class="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
				ShutterLife is a simple, browser-based tool that lets you instantly check your Sony camera's shutter count and model name.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- Instant Results -->
			<div class="bg-card border-border flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md">
				<div class="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold">Instant Results</h3>
				<p class="text-muted-foreground leading-relaxed">
					Simply select a RAW or JPEG file to see your shutter count in seconds. No waiting, no processing delays.
				</p>
			</div>

			<!-- Privacy-First -->
			<div class="bg-card border-border flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md">
				<div class="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold">Privacy-First</h3>
				<p class="text-muted-foreground leading-relaxed">
					All processing happens locally in your browser. Your files are never uploaded to a server and never leave your device.
				</p>
			</div>

			<!-- Zero Hassle -->
			<div class="bg-card border-border flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md">
				<div class="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold">Zero Hassle</h3>
				<p class="text-muted-foreground leading-relaxed">
					No software installations, no signups, and no waiting for uploads. Just open and use.
				</p>
			</div>

			<!-- Reliable Technology -->
			<div class="bg-card border-border flex flex-col rounded-2xl border p-8 shadow-sm transition-all hover:shadow-md">
				<div class="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold">Reliable Technology</h3>
				<p class="text-muted-foreground leading-relaxed">
					Built using the <a href="https://shuttertool.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">shuttertool.com</a> mechanism and the dcraw library for accurate data. (Currently supports Sony)
				</p>
			</div>
		</div>

		<div class="text-muted-foreground pt-8 text-center text-sm italic">
			Your privacy is our priority. We believe in tools that respect your data and your time.
		</div>

		<div class="mt-8 text-center text-sm text-muted-foreground opacity-70">
			<p>
				Copyright (c) 2025 <a href="https://github.com/chathura-de-silva/Shuttersnap" target="_blank" rel="noopener noreferrer" class="hover:text-primary underline-offset-4 transition-colors hover:underline">Chathura De Silva</a>
			</p>
		</div>
	</div>
</div>

