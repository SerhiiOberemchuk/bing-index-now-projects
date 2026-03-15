<script lang="ts">
	let { data, form } = $props();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const shorten = (value: string | null, max = 220) => {
		if (!value) return 'N/A';
		return value.length > max ? `${value.slice(0, max)}...` : value;
	};

	const confirmStatusChange = (event: SubmitEvent, status: string) => {
		if (!confirm(`Set alert status to ${status}?`)) {
			event.preventDefault();
		}
	};
</script>

<section class="head">
	<h2>Automation alerts</h2>
	<p>Consolidated failures from automation runs, IndexNow submissions, and sitemap fetches.</p>
</section>

{#if form?.error}
	<p class="note error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="note success">{form.success}</p>
{/if}

{#if !data.canView}
	<p class="note warn">Only manager or owner can view alerts.</p>
{:else}
	<section class="filters">
		<form method="GET" class="filters-form">
			<label>
				<span>Status</span>
				<select name="status" value={data.statusFilter}>
					<option value="all">All</option>
					<option value="active">Active</option>
					<option value="acknowledged">Acknowledged</option>
					<option value="resolved">Resolved</option>
				</select>
			</label>
			<div class="actions">
				<button type="submit">Apply</button>
				<a href="/dashboard/alerts">Reset</a>
			</div>
		</form>
	</section>

	<section class="stats">
		<article><p>Total alerts</p><strong>{data.stats.total}</strong></article>
		<article><p>Active</p><strong>{data.stats.active}</strong></article>
		<article><p>Acknowledged</p><strong>{data.stats.acknowledged}</strong></article>
		<article><p>Resolved</p><strong>{data.stats.resolved}</strong></article>
		<article><p>Automation</p><strong>{data.stats.automation}</strong></article>
		<article><p>Failed submissions</p><strong>{data.stats.submissions}</strong></article>
		<article><p>Failed sitemaps</p><strong>{data.stats.sitemaps}</strong></article>
	</section>

	<section class="panel-grid">
		<article class="panel">
			<h3>Automation run errors</h3>
			{#if data.automationAlerts.length === 0}
				<p class="empty">No automation run errors found.</p>
			{:else}
				<ul>
					{#each data.automationAlerts as row}
						<li>
							<div class="row-top">
								<strong>{formatDateTime(row.createdAt)}</strong>
								<div class="badges">
									<span class="badge {row.type}">{row.type}</span>
									<span class="status {row.status}">{row.status}</span>
								</div>
							</div>
							<p class="meta">{row.projectName ?? row.projectId ?? 'Unknown project'} - {row.projectDomain ?? '-'}</p>
							<ul class="error-list">
								{#each row.errors.slice(0, 3) as err}
									<li>{err}</li>
								{/each}
							</ul>
							{#if row.note}
								<p class="message"><strong>Note:</strong> {row.note}</p>
							{/if}
							<div class="actions">
								{#if row.projectId}
									<a href={`/dashboard/projects/${row.projectId}`}>Open project</a>
									<a href={`/dashboard/projects/${row.projectId}/sitemap`}>Sitemap page</a>
								{/if}
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'acknowledged')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="acknowledged" />
									<button type="submit">Acknowledge</button>
								</form>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'resolved')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="resolved" />
									<button type="submit" class="ok">Resolve</button>
								</form>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'active')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="active" />
									<button type="submit" class="ghost">Reopen</button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</article>

		<article class="panel">
			<h3>Failed IndexNow submissions</h3>
			{#if data.failedSubmissions.length === 0}
				<p class="empty">No failed submissions found.</p>
			{:else}
				<ul>
					{#each data.failedSubmissions as row}
						<li>
							<div class="row-top">
								<strong>{formatDateTime(row.createdAt)}</strong>
								<div class="badges">
									<span class="badge failed">HTTP {row.responseStatusCode ?? 'N/A'}</span>
									<span class="status {row.status}">{row.status}</span>
								</div>
							</div>
							<p class="meta">{row.projectDomain} - URLs: {row.urlCount}</p>
							<p class="message">{shorten(row.responseBody)}</p>
							{#if row.note}
								<p class="message"><strong>Note:</strong> {row.note}</p>
							{/if}
							<div class="actions">
								<a href={`/dashboard/projects/${row.projectId}`}>Open project</a>
								<a href="/dashboard/submissions">Open submissions</a>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'acknowledged')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="acknowledged" />
									<button type="submit">Acknowledge</button>
								</form>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'resolved')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="resolved" />
									<button type="submit" class="ok">Resolve</button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</article>

		<article class="panel">
			<h3>Failed sitemap fetches</h3>
			{#if data.failedSitemaps.length === 0}
				<p class="empty">No failed sitemap fetches found.</p>
			{:else}
				<ul>
					{#each data.failedSitemaps as row}
						<li>
							<div class="row-top">
								<strong>{formatDateTime(row.updatedAt)}</strong>
								<div class="badges">
									<span class="badge sitemap">sitemap</span>
									<span class="status {row.status}">{row.status}</span>
								</div>
							</div>
							<p class="meta">{row.projectDomain}</p>
							<p class="message"><strong>{row.sitemapUrl}</strong></p>
							<p class="message">{shorten(row.lastError)}</p>
							{#if row.note}
								<p class="message"><strong>Note:</strong> {row.note}</p>
							{/if}
							<div class="actions">
								<a href={`/dashboard/projects/${row.projectId}/sitemap`}>Open sitemap page</a>
								<a href={`/dashboard/projects/${row.projectId}`}>Open project</a>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'acknowledged')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="acknowledged" />
									<button type="submit">Acknowledge</button>
								</form>
								<form method="POST" action="?/setStatus" onsubmit={(event) => confirmStatusChange(event, 'resolved')}>
									<input type="hidden" name="fingerprint" value={row.fingerprint} />
									<input type="hidden" name="status" value="resolved" />
									<button type="submit" class="ok">Resolve</button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</article>
	</section>
{/if}

<style>
	.head h2 { margin: 0; }
	.head p { margin: 0.35rem 0 0; color: var(--text-soft); }

	.note {
		margin-top: 0.7rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
	}

	.note.warn { background: #fff4e8; border: 1px solid #ffd7b5; color: #c65f00; }
	.note.error { background: #ffe8e8; border: 1px solid #ffd0d0; color: var(--danger); }
	.note.success { background: #e8f8ef; border: 1px solid #c7efd7; color: var(--ok); }

	.filters {
		margin-top: 0.8rem;
		padding: 0.7rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--surface);
	}

	.filters-form {
		display: flex;
		gap: 0.55rem;
		align-items: end;
		flex-wrap: wrap;
	}

	label { display: grid; gap: 0.25rem; }
	label span { font-size: 0.84rem; color: var(--text-soft); }

	select,
	button,
	a {
		font: inherit;
		padding: 0.42rem 0.62rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	button { background: #eef3ff; color: #35558c; border-color: #cad6f2; cursor: pointer; }
	button.ok { background: #e8f8ef; border-color: #c7efd7; color: var(--ok); }
	button.ghost { background: var(--surface-soft); color: inherit; }
	a { text-decoration: none; background: var(--surface-soft); color: inherit; }

	.stats {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.7rem;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	}

	.stats article {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.75rem;
	}

	.stats p { margin: 0; font-size: 0.84rem; color: var(--text-soft); }
	.stats strong { display: block; margin-top: 0.35rem; font-size: 1.1rem; }

	.panel-grid {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.8rem;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}

	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.85rem;
	}

	.panel h3 { margin: 0; font-size: 1rem; }

	.panel ul {
		list-style: none;
		margin: 0.7rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}

	.panel li {
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.65rem;
	}

	.row-top {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
	}

	.badges { display: flex; gap: 0.35rem; align-items: center; }

	.meta { margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-soft); }
	.message { margin: 0.35rem 0 0; font-size: 0.85rem; word-break: break-word; }

	.badge,
	.status {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.badge.manual { background: #eef3ff; color: #35558c; }
	.badge.cron { background: #e8f8ef; color: var(--ok); }
	.badge.failed,
	.badge.sitemap { background: #ffe8e8; color: var(--danger); }

	.status.active { background: #fff4e8; color: var(--warn); }
	.status.acknowledged { background: #eef3ff; color: #35558c; }
	.status.resolved { background: #e8f8ef; color: var(--ok); }

	.error-list {
		margin: 0.45rem 0 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.25rem;
		color: var(--danger);
		font-size: 0.84rem;
	}

	.actions {
		margin-top: 0.55rem;
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.actions form { margin: 0; }

	.empty { margin: 0.7rem 0 0; color: var(--text-soft); }
</style>
