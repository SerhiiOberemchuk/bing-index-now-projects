<script lang="ts">
	let { data } = $props();

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
				return '-';
		}
	};
</script>

<section class="head">
	<h2>Automation runs</h2>
	<p>Manual and cron executions with full details per project.</p>
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
					<option value="cron">Cron</option>
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

			<div class="actions">
				<button type="submit">Apply</button>
				<a href="/dashboard/automation">Reset</a>
			</div>
		</form>
	</section>

	<section class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Time</th>
					<th>Type</th>
					<th>Project</th>
					<th>Schedule</th>
					<th>Sitemaps</th>
					<th>URLs</th>
					<th>Batches</th>
					<th>Errors</th>
					<th>Details</th>
				</tr>
			</thead>
			<tbody>
				{#if data.runs.length === 0}
					<tr><td colspan="9" class="empty">No automation runs found for current filters.</td></tr>
				{:else}
					{#each data.runs as row}
						<tr>
							<td>{formatDateTime(row.createdAt)}</td>
							<td>
								<span class="badge {row.source === 'manual' ? 'manual' : 'cron'}">{row.source}</span>
							</td>
							<td>
								<div>{row.projectName ?? row.projectId ?? '-'}</div>
								<div class="muted">{row.projectDomain ?? '-'}</div>
							</td>
							<td>{scheduleLabel(row.schedule)}</td>
							<td>{row.sitemapsSucceeded}/{row.sitemapsTried}</td>
							<td>{row.discoveredUrlsProcessed} / {row.selectedUrlsForIndexing}</td>
							<td>{row.submissionSucceeded}/{row.submissionBatches}</td>
							<td>
								{#if row.errorCount > 0}
									<span class="error-count">{row.errorCount}</span>
								{:else}
									<span class="muted">0</span>
								{/if}
							</td>
							<td>
								<details>
									<summary>View</summary>
									{#if row.errors.length > 0}
										<p class="muted">Errors:</p>
										<ul class="error-list">
											{#each row.errors as err}
												<li>{err}</li>
											{/each}
										</ul>
									{/if}
									<pre>{stringify(row.raw)}</pre>
								</details>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</section>
{/if}

<style>
	.head h2 {
		margin: 0;
	}

	.head p {
		margin: 0.35rem 0 0;
		color: var(--text-soft);
	}

	.note.warn {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}

	.filters {
		margin-top: 0.8rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.75rem;
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

	.actions {
		display: flex;
		gap: 0.45rem;
		align-items: center;
	}

	button {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
		cursor: pointer;
	}

	a {
		text-decoration: none;
		background: var(--surface-soft);
		color: inherit;
	}

	.table-wrap {
		margin-top: 0.9rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 1180px;
	}

	th,
	td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.8rem;
		color: var(--text-soft);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.empty {
		text-align: center;
		color: var(--text-soft);
	}

	.badge {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.badge.manual {
		background: #eef3ff;
		color: #35558c;
	}

	.badge.cron {
		background: #e8f8ef;
		color: var(--ok);
	}

	.muted {
		color: var(--text-soft);
		font-size: 0.82rem;
	}

	.error-count {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		background: #ffe8e8;
		color: var(--danger);
		font-size: 0.78rem;
	}

	summary {
		cursor: pointer;
		color: var(--brand);
	}

	.error-list {
		margin: 0.3rem 0 0.4rem;
		padding-left: 1rem;
		display: grid;
		gap: 0.2rem;
		color: var(--danger);
	}

	pre {
		margin: 0;
		padding: 0.5rem;
		background: #f5f7fc;
		border-radius: 8px;
		font-size: 0.78rem;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
