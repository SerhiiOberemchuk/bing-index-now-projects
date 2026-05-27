<script lang="ts">
	let { path = '/dashboard' } = $props<{ path?: string }>();

	const kind = $derived(
		path.includes('/projects/') && path.includes('/sitemap')
			? 'sitemap'
			: path.includes('/projects/')
				? 'project'
				: path.startsWith('/dashboard/projects')
					? 'projects'
					: path.startsWith('/dashboard/submissions')
						? 'submissions'
						: path.startsWith('/dashboard/automation')
							? 'automation'
							: path.startsWith('/dashboard/alerts')
								? 'alerts'
								: path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/admin')
									? 'settings'
									: 'overview'
	);

	const cards = $derived(kind === 'overview' ? 3 : kind === 'settings' ? 1 : 4);
	const rows = $derived(kind === 'overview' ? 4 : kind === 'project' ? 5 : kind === 'sitemap' ? 8 : 6);
</script>

<section class="skeleton-shell" aria-label="Loading page">
	<div class="hero">
		<div>
			<span class="line eyebrow"></span>
			<span class="line title"></span>
			<span class="line copy"></span>
		</div>
		<span class="button"></span>
	</div>

	<div class="cards" style={`--cards: ${cards}`}>
		{#each Array(cards) as _}
			<article>
				<span class="line small"></span>
				<span class="line number"></span>
			</article>
		{/each}
	</div>

	<div class="body">
		{#each Array(rows) as _, index}
			<article class="row">
				<div>
					<span class="line row-title"></span>
					<span class="line row-copy" style={`--w: ${index % 2 === 0 ? '68%' : '46%'}`}></span>
				</div>
				<span class="pill"></span>
			</article>
		{/each}
	</div>
</section>

<style>
	.skeleton-shell {
		display: grid;
		gap: 0.75rem;
	}

	.hero,
	.cards article,
	.row {
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
	}

	.hero {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(var(--cards), minmax(0, 1fr));
		gap: 0.75rem;
	}

	.cards article {
		padding: 0.85rem;
	}

	.body {
		display: grid;
		gap: 0.6rem;
	}

	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.85rem;
	}

	.line,
	.button,
	.pill {
		display: block;
		overflow: hidden;
		position: relative;
		border-radius: 999px;
		background: #e8eef8;
	}

	.line::after,
	.button::after,
	.pill::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
		transform: translateX(-100%);
		animation: shimmer 1.1s ease-in-out infinite;
	}

	.eyebrow {
		width: 86px;
		height: 10px;
	}

	.title {
		width: min(360px, 62vw);
		height: 24px;
		margin-top: 0.55rem;
	}

	.copy {
		width: min(560px, 72vw);
		height: 14px;
		margin-top: 0.55rem;
	}

	.small {
		width: 76px;
		height: 12px;
	}

	.number {
		width: 48px;
		height: 24px;
		margin-top: 0.5rem;
	}

	.row-title {
		width: min(340px, 58vw);
		height: 16px;
	}

	.row-copy {
		width: var(--w);
		height: 12px;
		margin-top: 0.45rem;
	}

	.button {
		flex: 0 0 auto;
		width: 132px;
		height: 40px;
	}

	.pill {
		flex: 0 0 auto;
		width: 84px;
		height: 28px;
	}

	@keyframes shimmer {
		to {
			transform: translateX(100%);
		}
	}

	@media (max-width: 760px) {
		.hero,
		.row {
			flex-direction: column;
		}

		.cards {
			grid-template-columns: 1fr;
		}

		.button,
		.pill {
			width: 100%;
			max-width: 180px;
		}
	}
</style>
