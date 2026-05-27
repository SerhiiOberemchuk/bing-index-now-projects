<script lang="ts">
	import { onMount } from 'svelte';
	import { navigating } from '$app/state';

	const isInternalLink = (anchor: HTMLAnchorElement) => {
		if (anchor.target && anchor.target !== '_self') return false;
		if (anchor.hasAttribute('download')) return false;

		const url = new URL(anchor.href);
		return url.origin === window.location.origin;
	};

	onMount(() => {
		const handleClick = (event: MouseEvent) => {
			if (!navigating.to) return;
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
				return;
			}

			const anchor = (event.target as Element | null)?.closest('a');
			if (!anchor || !isInternalLink(anchor)) return;

			event.preventDefault();
			event.stopImmediatePropagation();
		};

		document.addEventListener('click', handleClick, { capture: true });

		return () => {
			document.removeEventListener('click', handleClick, { capture: true });
		};
	});
</script>

{#if navigating.to}
	<div class="route-progress" aria-hidden="true"></div>
	<div class="navigation-click-shield" aria-hidden="true"></div>
{/if}

<style>
	.route-progress {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 2000;
		width: 100%;
		height: 3px;
		overflow: hidden;
		background: rgba(10, 110, 209, 0.16);
	}

	.navigation-click-shield {
		position: fixed;
		inset: 3px 0 0;
		z-index: 999;
		cursor: progress;
		background: transparent;
	}

	.route-progress::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 38%;
		background: var(--brand);
		animation: route-progress 0.9s ease-in-out infinite;
	}

	@keyframes route-progress {
		0% {
			transform: translateX(-100%);
		}
		55% {
			transform: translateX(150%);
		}
		100% {
			transform: translateX(280%);
		}
	}
</style>
