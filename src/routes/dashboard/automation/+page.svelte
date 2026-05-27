<script lang="ts">
	let { data } = $props();

	const errorRuns = $derived(data.runs.filter((row) => row.errorCount > 0).length);
	const totalUrls = $derived(data.runs.reduce((total, row) => total + row.selectedUrlsForIndexing, 0));
	const successfulBatches = $derived(data.runs.reduce((total, row) => total + row.submissionSucceeded, 0));

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const stringify = (value: unknown) => {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value ?? '');
		}
	};

	const scheduleLabel = (value: string | null) => {
		switch (value) {
			case 'every_6h':
				return 'Every 6 hours';
			case 'daily':
				return 'Daily';
			case 'weekly':
				return 'Weekly';
			case 'disabled':
				return 'Disabled';
			default:
				return 'Not set';
		}
	};
</script>

<section class="page-head">
	<div>
		<h2>Automation</h2>
		<p>Manual and scheduled runs. Use this page to verify what automation actually processed.</p>
	</div>
</section>

{#if !data.canView}
	<p class="note warn">Only manager or owner can view automation runs.</p>
{:else}
	<section class="filters">
		<form method="GET" class="filters-form">
			<label>
				<span>Type</span>
				<select name="type" value={data.typeFilter}>
					<option value="all">All</option>
					<option value="manual">Manual</option>
					<option value="cron">Scheduled</option>
				</select>
			</label>

			<label>
				<span>Project</span>
				<select name="projectId" value={data.projectIdFilter}>
					<option value="">All projects</option>
					{#each data.projects as project}
						<option value={project.id}>{project.name} ({project.domain})</option>
					{/each}
				</select>
			</label>

			<div class="filter-actions">
				<button type="submit">Apply</button>
				<a href="/dashboard/automation">Reset</a>
			</div>
		</form>
	</section>

	<section class="summary" aria-label="Automation summary">
		<article>
			<p>Runs shown</p>
			<strong>{data.runs.length}</strong>
		</article>
		<article class:attention={errorRuns > 0}>
			<p>Runs with errors</p>
			<strong>{errorRuns}</strong>
		</article>
		<article>
			<p>URLs selected</p>
			<strong>{totalUrls}</strong>
		</article>
		<article>
			<p>Successful batches</p>
			<strong>{successfulBatches}</strong>
		</article>
	</section>

	<section class="run-list">
		{#if data.runs.length === 0}
			<p class="empty">No automation runs found for current filters.</p>
		{:else}
			{#each data.runs as row}
				<article class="run" class:failed={row.errorCount > 0 || row.submissionFailed > 0}>
					<div class="run-head">
						<div>
							<h3>{row.projectName ?? row.projectDomain ?? row.projectId ?? 'Workspace run'}</h3>
							<p>{formatDateTime(row.createdAt)} - {scheduleLabel(row.schedule)}</p>
						</div>
						<div class="badges">
							<span class="badge {row.source === 'manual' ? 'manual' : 'cron'}">{row.source === 'manual' ? 'Manual' : 'Scheduled'}</span>
							{#if row.errorCount > 0}
								<span class="badge failed">{row.errorCount} error{row.errorCount === 1 ? '' : 's'}</span>
							{:else}
								<span class="badge success">OK</span>
							{/if}
						</div>
					</div>

					<div class="signals">
						<div>
							<span>Sitemaps</span>
							<strong>{row.sitemapsSucceeded}/{row.sitemapsTried}</strong>
						</div>
						<div>
							<span>URLs</span>
							<strong>{row.discoveredUrlsProcessed} / {row.selectedUrlsForIndexing}</strong>
						</div>
						<div>
							<span>Batches</span>
							<strong>{row.submissionSucceeded}/{row.submissionBatches}</strong>
						</div>
					</div>

					{#if row.errors.length > 0}
						<ul class="error-list">
							{#each row.errors.slice(0, 3) as err}
								<li>{err}</li>
							{/each}
						</ul>
					{/if}

					<details>
						<summary>Technical details</summary>
						<pre>{stringify(row.raw)}</pre>
					</details>
				</article>
			{/each}
		{/if}
	</section>
{/if}

<style>
	.page-head h2,
	h3,
	p {
		margin: 0;
	}

	.page-head p,
	.signals span,
	.empty {
		color: var(--text-soft);
	}

	.page-head p {
		margin-top: 0.35rem;
	}

	.note {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
	}

	.note.warn {
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}

	.filters,
	.summary article,
	.run {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.filters {
		margin-top: 0.8rem;
		padding: 0.8rem;
	}

	.filters-form {
		display: grid;
		gap: 0.65rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		align-items: end;
	}

	label {
		display: grid;
		gap: 0.3rem;
	}

	label span {
		font-size: 0.85rem;
		color: var(--text-soft);
	}

	select,
	button,
	a {
		font: inherit;
		padding: 0.52rem 0.65rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	.filter-actions {
		display: flex;
		gap: 0.45rem;
		align-items: center;
	}

	button {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
		cursor: pointer;
		font-weight: 700;
	}

	a {
		text-decoration: none;
		background: var(--surface-soft);
		color: inherit;
	}

	.summary {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.summary article {
		padding: 0.8rem;
	}

	.summary article.attention,
	.run.failed {
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

	.run-list {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.65rem;
	}

	.empty {
		padding: 0.8rem;
		border: 1px dashed var(--border);
		border-radius: 8px;
	}

	.run {
		padding: 0.85rem;
		display: grid;
		gap: 0.65rem;
	}

	.run-head {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: start;
	}

	.run-head h3 {
		font-size: 1rem;
	}

	.run-head p {
		margin-top: 0.25rem;
		color: var(--text-soft);
	}

	.badges {
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.badge {
		display: inline-block;
		padding: 0.2rem 0.48rem;
		border-radius: 999px;
		font-size: 0.78rem;
	}

	.badge.manual {
		background: #eef3ff;
		color: #35558c;
	}

	.badge.cron,
	.badge.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.failed {
		background: #ffe8e8;
		color: var(--danger);
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
	}

	.error-list {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.25rem;
		color: var(--danger);
		font-size: 0.86rem;
	}

	summary {
		cursor: pointer;
		color: var(--brand);
	}

	pre {
		margin: 0.45rem 0 0;
		padding: 0.55rem;
		border-radius: 8px;
		background: #f5f7fc;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.78rem;
	}

	@media (max-width: 760px) {
		.summary,
		.signals {
			grid-template-columns: 1fr;
		}

		.run-head {
			align-items: stretch;
			flex-direction: column;
		}

		.badges {
			justify-content: flex-start;
		}
	}
</style>
