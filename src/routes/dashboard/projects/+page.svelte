<script lang="ts">
	let { data } = $props();

	const activeCount = $derived(data.projects.filter((row) => row.status === 'active').length);
	const attentionCount = $derived(
		data.projects.filter((row) => row.healthStatus === 'warning' || row.healthStatus === 'setup_required').length
	);
	const pendingCount = $derived(data.projects.reduce((total, row) => total + row.pendingIndexing, 0));

	const formatDateTime = (value: string | Date | null, fallback = 'No submissions yet') => {
		if (!value) return fallback;
		return new Date(value).toLocaleString();
	};

	const scheduleLabel = (value: string) => {
		switch (value) {
			case 'every_6h':
				return 'Every 6 hours';
			case 'daily':
				return 'Daily';
			case 'weekly':
				return 'Weekly';
			default:
				return 'Disabled';
		}
	};

	const healthLabel = (value: string) => {
		switch (value) {
			case 'healthy':
				return 'Healthy';
			case 'warning':
				return 'Needs attention';
			case 'paused':
				return 'Paused';
			case 'setup_required':
				return 'Setup required';
			default:
				return 'Active';
		}
	};
</script>

<section class="page-head">
	<div>
		<h2>Projects</h2>
		<p>One card per domain. Open a project to submit URLs, fetch sitemap data or change automation.</p>
	</div>
	{#if data.canManage}
		<a href="/dashboard/projects/new" class="primary">New project</a>
	{:else}
		<span class="primary disabled">New project</span>
	{/if}
</section>

{#if !data.canManage}
	<p class="note warn">Read-only access. Project changes are disabled for your role.</p>
{/if}

<section class="summary" aria-label="Project summary">
	<article>
		<p>Total</p>
		<strong>{data.projects.length}</strong>
	</article>
	<article>
		<p>Active</p>
		<strong>{activeCount}</strong>
	</article>
	<article class:attention={attentionCount > 0}>
		<p>Needs attention</p>
		<strong>{attentionCount}</strong>
	</article>
	<article>
		<p>Pending URLs</p>
		<strong>{pendingCount}</strong>
	</article>
</section>

{#if data.projects.length === 0}
	<section class="empty-state">
		<h3>No projects yet</h3>
		<p>Create a project, verify the IndexNow key, then submit URLs from the project screen.</p>
		{#if data.canManage}
			<a href="/dashboard/projects/new" class="primary">Create first project</a>
		{/if}
	</section>
{:else}
	<section class="project-list">
		{#each data.projects as row}
			<article class="project-card" class:attention={row.healthStatus === 'warning' || row.healthStatus === 'setup_required'}>
				<div class="card-main">
					<div>
						<h3>{row.name}</h3>
						<p>{row.domain}</p>
					</div>
					<div class="badges">
						<span class="badge {row.healthStatus}">{healthLabel(row.healthStatus)}</span>
						<span class:paused={row.status === 'paused'} class="badge status">{row.status}</span>
					</div>
				</div>

				<div class="signals">
					<div>
						<span>Pending</span>
						<strong>{row.pendingIndexing}</strong>
					</div>
					<div>
						<span>Success</span>
						<strong>{row.successRate === null ? 'N/A' : `${row.successRate}%`}</strong>
					</div>
					<div>
						<span>Schedule</span>
						<strong>{scheduleLabel(row.schedule)}</strong>
					</div>
				</div>

				<div class="meta">
					<p>Last submission: {formatDateTime(row.lastSubmissionAt)}</p>
					{#if row.lastFailureCode}
						<p class="error">Last error: HTTP {row.lastFailureCode} at {formatDateTime(row.lastFailureAt, 'N/A')}</p>
					{:else}
						<p>No recent error recorded.</p>
					{/if}
				</div>

				<div class="actions">
					<a class="primary small" href={`/dashboard/projects/${row.id}`}>Open</a>
					<a class="secondary small" href={`/dashboard/projects/${row.id}/sitemap`}>Sitemap</a>
					<a class="secondary small" href={`/dashboard/projects/${row.id}/history`}>History</a>
				</div>
			</article>
		{/each}
	</section>
{/if}

<style>
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 0.8rem;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	.page-head p,
	.meta,
	.signals span,
	.empty-state p {
		color: var(--text-soft);
	}

	.page-head p {
		margin-top: 0.35rem;
	}

	.primary,
	.secondary {
		text-decoration: none;
		border-radius: 8px;
		border: 1px solid var(--border);
		font-weight: 700;
		white-space: nowrap;
	}

	.primary {
		padding: 0.58rem 0.85rem;
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}

	.secondary {
		padding: 0.5rem 0.72rem;
		background: var(--surface-soft);
	}

	.primary.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.note {
		margin-top: 0.75rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
	}

	.note.warn {
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.8rem;
	}

	.summary article,
	.project-card,
	.empty-state {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.summary article {
		padding: 0.8rem;
	}

	.summary article.attention,
	.project-card.attention {
		border-color: #ffd0d0;
	}

	.summary p {
		color: var(--text-soft);
		font-size: 0.82rem;
	}

	.summary strong {
		display: block;
		margin-top: 0.25rem;
		font-size: 1.35rem;
	}

	.empty-state {
		margin-top: 0.8rem;
		padding: 1rem;
		display: grid;
		gap: 0.55rem;
		justify-items: start;
	}

	.project-list {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.75rem;
	}

	.project-card {
		padding: 0.9rem;
		display: grid;
		gap: 0.75rem;
	}

	.card-main {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: start;
	}

	.card-main h3 {
		font-size: 1rem;
	}

	.card-main p {
		margin-top: 0.25rem;
		color: var(--text-soft);
	}

	.badges,
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		justify-content: flex-end;
	}

	.badge {
		display: inline-block;
		padding: 0.2rem 0.48rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.badge.healthy,
	.badge.status {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.warning,
	.badge.status.paused {
		background: #fff4e8;
		color: var(--warn);
	}

	.badge.setup_required,
	.badge.paused {
		background: #ffe8e8;
		color: var(--danger);
	}

	.badge.active {
		background: #eef3ff;
		color: #35558c;
	}

	.signals {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.55rem;
	}

	.signals div {
		padding: 0.62rem;
		border-radius: 8px;
		background: var(--surface-soft);
	}

	.signals span,
	.signals strong {
		display: block;
	}

	.signals strong {
		margin-top: 0.22rem;
		font-size: 0.96rem;
	}

	.meta {
		display: grid;
		gap: 0.25rem;
		font-size: 0.88rem;
	}

	.meta .error {
		color: var(--danger);
	}

	.actions {
		justify-content: flex-start;
	}

	.small {
		padding: 0.45rem 0.65rem;
	}

	@media (max-width: 760px) {
		.page-head,
		.card-main {
			align-items: stretch;
			flex-direction: column;
		}

		.summary,
		.signals {
			grid-template-columns: 1fr;
		}

		.badges {
			justify-content: flex-start;
		}
	}
</style>
