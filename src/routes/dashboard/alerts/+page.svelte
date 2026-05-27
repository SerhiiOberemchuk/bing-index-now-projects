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

<section class="page-head">
	<div>
		<h2>Alerts</h2>
		<p>Problems that need a decision: acknowledge, resolve, or reopen.</p>
	</div>
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

	<section class="summary" aria-label="Alert summary">
		<article class:attention={data.stats.active > 0}>
			<p>Active</p>
			<strong>{data.stats.active}</strong>
		</article>
		<article>
			<p>Acknowledged</p>
			<strong>{data.stats.acknowledged}</strong>
		</article>
		<article>
			<p>Resolved</p>
			<strong>{data.stats.resolved}</strong>
		</article>
		<article>
			<p>Total</p>
			<strong>{data.stats.total}</strong>
		</article>
	</section>

	<section class="alert-section">
		<h3>Automation</h3>
		{#if data.automationAlerts.length === 0}
			<p class="empty">No automation alerts.</p>
		{:else}
			{#each data.automationAlerts as row}
				<article class="alert-card">
					<div class="row-top">
						<div>
							<strong>{row.projectName ?? row.projectId ?? 'Unknown project'}</strong>
							<p>{row.projectDomain ?? '-'} - {formatDateTime(row.createdAt)}</p>
						</div>
						<span class="status {row.status}">{row.status}</span>
					</div>
					<ul class="error-list">
						{#each row.errors.slice(0, 3) as err}
							<li>{err}</li>
						{/each}
					</ul>
					<div class="card-actions">
						{#if row.projectId}
							<a href={`/dashboard/projects/${row.projectId}`}>Project</a>
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
					</div>
				</article>
			{/each}
		{/if}
	</section>

	<section class="alert-section">
		<h3>Failed submissions</h3>
		{#if data.failedSubmissions.length === 0}
			<p class="empty">No failed submissions.</p>
		{:else}
			{#each data.failedSubmissions as row}
				<article class="alert-card">
					<div class="row-top">
						<div>
							<strong>{row.projectDomain}</strong>
							<p>{formatDateTime(row.createdAt)} - {row.urlCount} URLs - HTTP {row.responseStatusCode ?? 'N/A'}</p>
						</div>
						<span class="status {row.status}">{row.status}</span>
					</div>
					<p class="message">{shorten(row.responseBody)}</p>
					<div class="card-actions">
						<a href={`/dashboard/projects/${row.projectId}`}>Project</a>
						<a href="/dashboard/submissions">Submissions</a>
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
				</article>
			{/each}
		{/if}
	</section>

	<section class="alert-section">
		<h3>Sitemap fetches</h3>
		{#if data.failedSitemaps.length === 0}
			<p class="empty">No failed sitemap fetches.</p>
		{:else}
			{#each data.failedSitemaps as row}
				<article class="alert-card">
					<div class="row-top">
						<div>
							<strong>{row.projectDomain}</strong>
							<p>{formatDateTime(row.updatedAt)}</p>
						</div>
						<span class="status {row.status}">{row.status}</span>
					</div>
					<p class="message">{row.sitemapUrl}</p>
					<p class="message">{shorten(row.lastError)}</p>
					<div class="card-actions">
						<a href={`/dashboard/projects/${row.projectId}/sitemap`}>Sitemap</a>
						<a href={`/dashboard/projects/${row.projectId}`}>Project</a>
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
	.row-top p,
	.message,
	.empty {
		color: var(--text-soft);
	}

	.page-head p {
		margin-top: 0.35rem;
	}

	.note {
		margin-top: 0.7rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
	}

	.note.warn { background: #fff4e8; border: 1px solid #ffd7b5; color: #c65f00; }
	.note.error { background: #ffe8e8; border: 1px solid #ffd0d0; color: var(--danger); }
	.note.success { background: #e8f8ef; border: 1px solid #c7efd7; color: var(--ok); }

	.filters,
	.summary article,
	.alert-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.filters {
		margin-top: 0.8rem;
		padding: 0.75rem;
	}

	.filters-form,
	.actions,
	.card-actions {
		display: flex;
		gap: 0.5rem;
		align-items: end;
		flex-wrap: wrap;
	}

	label {
		display: grid;
		gap: 0.25rem;
	}

	label span {
		font-size: 0.84rem;
		color: var(--text-soft);
	}

	select,
	button,
	a {
		font: inherit;
		padding: 0.42rem 0.62rem;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	button {
		background: #eef3ff;
		color: #35558c;
		border-color: #cad6f2;
		cursor: pointer;
	}

	button.ok {
		background: #e8f8ef;
		border-color: #c7efd7;
		color: var(--ok);
	}

	a {
		text-decoration: none;
		background: var(--surface-soft);
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

	.summary article.attention {
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

	.alert-section {
		margin-top: 0.9rem;
		display: grid;
		gap: 0.6rem;
	}

	.alert-card {
		padding: 0.8rem;
		display: grid;
		gap: 0.55rem;
	}

	.row-top {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 0.75rem;
	}

	.row-top p {
		margin-top: 0.25rem;
		font-size: 0.86rem;
	}

	.status {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.status.active { background: #fff4e8; color: var(--warn); }
	.status.acknowledged { background: #eef3ff; color: #35558c; }
	.status.resolved { background: #e8f8ef; color: var(--ok); }

	.error-list {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.25rem;
		color: var(--danger);
		font-size: 0.86rem;
	}

	.message {
		font-size: 0.86rem;
		word-break: break-word;
	}

	.card-actions form {
		margin: 0;
	}

	.empty {
		padding: 0.75rem;
		border: 1px dashed var(--border);
		border-radius: 8px;
	}

	@media (max-width: 760px) {
		.summary {
			grid-template-columns: 1fr;
		}

		.row-top {
			flex-direction: column;
		}
	}
</style>
