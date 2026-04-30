<script lang="ts">
	import ModeToggle from './mode-toggle.svelte';
	import { page } from '$app/state';
	import { baseRoutes, cn, supportedBrands } from '$lib/utils';
	import { base } from '$app/paths';

	let mobileDropdownOpen = $state(false);

	function toggleMobileDropdown() {
		mobileDropdownOpen = !mobileDropdownOpen;
	}

	function closeMobileDropdown() {
		mobileDropdownOpen = false;
	}

	export function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (mobileDropdownOpen && !target.closest('[data-dropdown]')) {
			closeMobileDropdown();
		}
	}
</script>

<nav
	class="bg-background/90 fixed top-0 right-0 left-0 z-50
	flex max-w-full items-center justify-between border-b px-6 py-3.5 backdrop-blur"
>
	<div class="flex items-center gap-1">
		<a
			href={base + baseRoutes.app}
			class={cn(
				'rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent',
				page.url.pathname === baseRoutes.app && 'bg-accent'
			)}
		>
			Home
		</a>

		<a
			href={base + baseRoutes.about}
			class={cn(
				'hidden rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent md:block',
				page.url.pathname.startsWith(baseRoutes.about) && 'bg-accent'
			)}
		>
			About
		</a>
	</div>

	<div class="flex items-center gap-4">
		<ModeToggle />

		<!-- Mobile three-dot dropdown -->
		<div class="relative md:hidden" data-dropdown>
			<button
				onclick={toggleMobileDropdown}
				class="text-foreground hover:bg-accent focus:ring-ring inline-flex items-center justify-center rounded-md p-2 focus:ring-2 focus:outline-none focus:ring-inset"
				aria-expanded={mobileDropdownOpen}
				aria-label="More options"
			>
				{#if !mobileDropdownOpen}
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
					</svg>
				{:else}
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6 6 18M6 6l12 12"/>
					</svg>
				{/if}
			</button>

			{#if mobileDropdownOpen}
				<div
					class="bg-background/95 absolute top-full right-0 mt-2 w-48 rounded-lg border p-2 shadow-lg backdrop-blur-sm"
				>
					<div class="mb-2">
						<div class="text-muted-foreground px-3 py-2 text-xs font-medium tracking-wide uppercase">
							Supported Devices
						</div>
						{#each supportedBrands as brand (brand.path)}
							<a
								href={base + baseRoutes.supportedDevices + '/' + brand.path}
								onclick={closeMobileDropdown}
								class={cn(
									'hover:bg-accent block rounded-md px-4 py-2 text-sm transition-colors',
									page.url.pathname.startsWith(base + baseRoutes.supportedDevices + brand.path) &&
										'bg-accent'
								)}
							>
								{brand.name}
							</a>
						{/each}
					</div>

					<div class="my-2 border-t"></div>

					<a
						href={base + baseRoutes.faq}
						onclick={closeMobileDropdown}
						class={cn(
							'hover:bg-accent block rounded-md px-3 py-2 text-sm font-medium transition-colors',
							page.url.pathname === baseRoutes.faq && 'bg-accent'
						)}
					>
						FAQ
					</a>
					<a
						href={base + baseRoutes.about}
						onclick={closeMobileDropdown}
						class={cn(
							'hover:bg-accent block rounded-md px-3 py-2 text-sm font-medium transition-colors',
							page.url.pathname.startsWith(baseRoutes.about) && 'bg-accent'
						)}
					>
						About
					</a>
				</div>
			{/if}
		</div>
	</div>
</nav>
