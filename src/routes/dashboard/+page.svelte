<script lang="ts">
	let { data } = $props();

	const failedRecent = $derived(data.recentSubmissions.filter((row) => row.status === 'failed').length);
	const needsSetup = $derived(data.stats.totalProjects === 0);
	const hasFailures = $derived(failedRecent > 0);
	const successRateLabel = $derived(
		data.stats.todaySubmissions > 0 ? `${data.stats.todaySuccessRate}%` : 'No submits yet'
	);

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'No activity';
		return new Date(value).toLocaleString();
	};
</script>

<section class="command-center" class:warning={hasFailures} class:empty={needsSetup}>
	<div>
		<p class="eyebrow">Current state</p>
		<h2>
			{#if needsSetup}
				Add your first project
			{:else if hasFailures}
				{failedRecent} recent submission issue{failedRecent === 1 ? '' : 's'}
			{:else}
				Indexing is running
			{/if}
		</h2>
		<p>
			{#if needsSetup}
				Connect a domain, verify the IndexNow key, then submit URLs from one project screen.
			{:else if hasFailures}
				Review failed submissions first. Successful projects can keep running in the background.
			{:else}
				{data.stats.activeProjects} active project{data.stats.activeProjects === 1 ? '' : 's'}.
				Today success rate: {successRateLabel}.
			{/if}
		</p>
	</div>

	<div class="primary-actions">
		{#if needsSetup}
			{#if data.canManage}
				<a class="primary" href="/dashboard/projects/new">Create project</a>
			{:else}
				<span class="primary disabled">Create project</span>
			{/if}
		{:else if hasFailures}
			<a class="primary danger" href="/dashboard/alerts">Review alerts</a>
		{:else}
			<a class="primary" href="/dashboard/projects">Open projects</a>
		{/if}
		<a class="secondary" href="/dashboard/submissions">Submission history</a>
	</div>
</section>

<section class="summary-grid" aria-label="Platform summary">
	<article>
		<p>Projects</p>
		<strong>{data.stats.totalProjects}</strong>
		<span>{data.stats.activeProjects} active / {data.stats.pausedProjects} paused</span>
	</article>
	<article>
		<p>Submitted today</p>
		<strong>{data.stats.todaySubmissions}</strong>
		<span>{successRateLabel}</span>
	</article>
	<article class:attention={hasFailures}>
		<p>Needs attention</p>
		<strong>{failedRecent}</strong>
		<span>failed in recent activity</span>
	</article>
</section>

<section class="workbench">
	<article class="panel next-actions">
		<header>
			<h3>Next actions</h3>
			<p>Most common work is reachable from here.</p>
		</header>

		<div class="action-list">
			<a href="/dashboard/projects">
				<strong>Manage projects</strong>
				<span>Open domains, schedules, health and manual submit tools.</span>
			</a>
			<a href="/dashboard/alerts">
				<strong>Fix alerts</strong>
				<span>Resolve failed automation, sitemap and IndexNow events.</span>
			</a>
			{#if data.canManage}
				<a href="/dashboard/projects/new">
					<strong>Add project</strong>
					<span>Connect a new domain and start indexing.</span>
				</a>
			{/if}
		</div>
	</article>

	<article class="panel">
		<header>
			<h3>Recent activity</h3>
			<p>Latest submission events only.</p>
		</header>

		{#if data.recentSubmissions.length === 0}
			<p class="empty-state">No submissions yet.</p>
		{:else}
			<ul class="activity-list">
				{#each data.recentSubmissions as row}
					<li>
						<div>
							<strong>{row.projectDomain}</strong>
							<span>{row.urlCount} URL{row.urlCount === 1 ? '' : 's'} - {formatDateTime(row.createdAt)}</span>
						</div>
						<span class="status {row.status}">{row.status}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</section>

<style>
	.command-center {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #c7efd7;
		border-radius: 8px;
		background: #f4fbf7;
	}

	.command-center.warning {
		border-color: #ffd0d0;
		background: #fff7f7;
	}

	.command-center.empty {
		border-color: #cad6f2;
		background: #f7f9ff;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-soft);
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		margin-top: 0.25rem;
		font-size: 1.35rem;
	}

	.command-center p:not(.eyebrow),
	header p,
	.summary-grid span,
	.activity-list span,
	.action-list span,
	.empty-state {
		color: var(--text-soft);
	}

	.command-center p:not(.eyebrow) {
		margin-top: 0.35rem;
		max-width: 680px;
	}

	.primary-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.primary,
	.secondary,
	.action-list a {
		text-decoration: none;
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.primary,
	.secondary {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding: 0.55rem 0.8rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}

	.primary.danger {
		background: var(--danger);
		border-color: var(--danger);
	}

	.primary.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.secondary {
		background: var(--surface);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.summary-grid article,
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.summary-grid article {
		padding: 0.85rem;
	}

	.summary-grid article.attention {
		border-color: #ffd0d0;
	}

	.summary-grid p {
		font-size: 0.82rem;
		color: var(--text-soft);
	}

	.summary-grid strong {
		display: block;
		margin: 0.25rem 0;
		font-size: 1.55rem;
	}

	.workbench {
		display: grid;
		grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
		gap: 0.75rem;
		margin-top: 0.75rem;
	}

	.panel {
		padding: 0.9rem;
	}

	header {
		display: grid;
		gap: 0.25rem;
	}

	h3 {
		font-size: 1rem;
	}

	.action-list,
	.activity-list {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.action-list a {
		display: grid;
		gap: 0.2rem;
		padding: 0.7rem;
		background: var(--surface-soft);
	}

	.activity-list {
		padding: 0;
		list-style: none;
	}

	.activity-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.7rem;
		padding: 0.65rem 0;
		border-bottom: 1px solid var(--border);
	}

	.activity-list li:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}

	.activity-list strong,
	.activity-list span:not(.status) {
		display: block;
	}

	.status {
		flex: 0 0 auto;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
		background: #eef3ff;
		color: #35558c;
	}

	.status.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.status.failed {
		background: #ffe8e8;
		color: var(--danger);
	}

	.empty-state {
		margin-top: 0.75rem;
	}

	@media (max-width: 900px) {
		.command-center {
			align-items: stretch;
			flex-direction: column;
		}

		.primary-actions {
			justify-content: flex-start;
		}

		.summary-grid,
		.workbench {
			grid-template-columns: 1fr;
		}
	}
</style>
