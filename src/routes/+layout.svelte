<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		--bg: #f3f6fb;
		--surface: #ffffff;
		--surface-soft: #eef3ff;
		--border: #dbe3f2;
		--text: #0f172a;
		--text-soft: #52607a;
		--brand: #0a6ed1;
		--brand-2: #0f4fbf;
		--ok: #117a4f;
		--warn: #c65f00;
		--danger: #b42318;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: radial-gradient(circle at top right, #e9f2ff 0%, var(--bg) 45%);
		color: var(--text);
	}

	:global(a) {
		color: inherit;
	}

	:global(code) {
		font-family: 'Cascadia Code', 'Consolas', monospace;
		font-size: 0.9em;
	}
</style>
