<script lang="ts">
	let { data, form } = $props();

	const canManage = () => Boolean(data.canManage);
	const formValue = (key: string, fallback = '') =>
		((form as Record<string, unknown> | undefined)?.[key] as string | undefined) ?? fallback;

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

	const confirmRetry = (event: SubmitEvent) => {
		if (!canManage()) {
			event.preventDefault();
			return;
		}

		if (!confirm('Retry this submission now?')) {
			event.preventDefault();
		}
	};

	const confirmBulkRetry = (event: SubmitEvent) => {
		if (!canManage()) {
			event.preventDefault();
			return;
		}

		if (!confirm('Retry failed submissions from the selected recent window?')) {
			event.preventDefault();
		}
	};
</script>

<section class="head">
	<h2>Submissions log</h2>
	<p>Latest 100 records from the database. Expand a row to view full Bing response and payload.</p>
</section>

<section class="bulk-panel">
	<p>
		Failed entries in current list: <strong>{data.failedInList}</strong>
	</p>
	<form method="POST" action="?/retryFailedRecent" onsubmit={confirmBulkRetry}>
		<label>
			Retry failed in last
			<input name="limit" type="number" min="1" max="100" value={formValue('limit', '20')} disabled={!canManage()} />
			records
		</label>
		<button type="submit" class="secondary" disabled={!canManage()}>Run bulk retry</button>
	</form>
</section>

{#if !canManage()}
	<p class="feedback warn">You have read-only access. Retry actions are disabled for your role.</p>
{/if}

{#if form?.error}
	<p class="feedback error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="feedback success">{form.success}</p>
{/if}

{#if form?.retryResult}
	<section class="retry-result">
		<p><strong>Latest retry response</strong></p>
		<pre>{stringify(form.retryResult)}</pre>
	</section>
{/if}

{#if form?.bulkResult}
	<section class="retry-result">
		<p><strong>Latest bulk retry response</strong></p>
		<pre>{stringify(form.bulkResult)}</pre>
	</section>
{/if}

<section class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Timestamp</th>
				<th>Project</th>
				<th>URLs</th>
				<th>Status</th>
				<th>HTTP</th>
				<th>Action</th>
				<th>Details</th>
			</tr>
		</thead>
		<tbody>
			{#if data.submissions.length === 0}
				<tr>
					<td colspan="7" class="empty">No submissions yet.</td>
				</tr>
			{:else}
				{#each data.submissions as row}
					<tr>
						<td>{formatDateTime(row.createdAt)}</td>
						<td><a href={`/dashboard/projects/${row.projectId}`}>{row.projectDomain}</a></td>
						<td>{row.urlCount}</td>
						<td><span class="badge {row.status}">{row.status}</span></td>
						<td>{row.responseStatusCode ?? 'N/A'}</td>
						<td>
							{#if row.status === 'failed'}
								<form method="POST" action="?/retrySubmission" onsubmit={confirmRetry}>
									<input type="hidden" name="submissionId" value={row.id} />
									<button type="submit" class="retry" disabled={!canManage()}>Retry failed</button>
								</form>
							{:else}
								<span class="action-muted">-</span>
							{/if}
						</td>
						<td>
							<details>
								<summary>View full response</summary>
								<div class="details-content">
									<p><strong>Submission ID:</strong> <code>{row.id}</code></p>
									<p><strong>Full response body:</strong></p>
									<pre>{row.responseBody ?? '(empty response body)'}</pre>
									<p><strong>Sent payload:</strong></p>
									<pre>{stringify(row.payload)}</pre>
								</div>
							</details>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</section>

<style>
	.head h2 {
		margin: 0;
	}

	.head p {
		margin: 0.35rem 0 0;
		color: var(--text-soft);
	}

	.bulk-panel {
		margin-top: 0.8rem;
		padding: 0.7rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.bulk-panel p {
		margin: 0;
		color: var(--text-soft);
	}

	.bulk-panel form {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.bulk-panel label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.88rem;
	}

	.bulk-panel input {
		width: 84px;
		padding: 0.42rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		font: inherit;
	}

	.feedback {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.92rem;
	}

	.feedback.warn {
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}

	.feedback.error {
		background: #ffe8e8;
		border: 1px solid #ffd0d0;
		color: var(--danger);
	}

	.feedback.success {
		background: #e8f8ef;
		border: 1px solid #c7efd7;
		color: var(--ok);
	}

	.retry-result {
		margin-top: 0.8rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.7rem;
	}

	.retry-result p {
		margin: 0 0 0.4rem;
	}

	.retry-result pre {
		margin: 0;
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
		min-width: 1140px;
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

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.empty {
		text-align: center;
		color: var(--text-soft);
	}

	.badge {
		display: inline-block;
		text-transform: capitalize;
		padding: 0.17rem 0.5rem;
		border-radius: 999px;
		font-size: 0.78rem;
	}

	.badge.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.failed {
		background: #ffe8e8;
		color: var(--danger);
	}

	button.secondary,
	.retry {
		font: inherit;
		padding: 0.45rem 0.65rem;
		border-radius: 8px;
		cursor: pointer;
	}

	button.secondary {
		border: 1px solid #cad6f2;
		background: #eef3ff;
		color: #35558c;
	}

	.retry {
		border: 1px solid #fac5bf;
		background: #fff1f0;
		color: #9f2418;
	}

	.retry:disabled,
	button.secondary:disabled,
	.bulk-panel input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-muted {
		color: var(--text-soft);
	}

	summary {
		cursor: pointer;
		color: var(--brand);
	}

	.details-content {
		margin-top: 0.5rem;
		display: grid;
		gap: 0.35rem;
	}

	.details-content p {
		margin: 0;
		font-size: 0.86rem;
	}

	pre {
		margin: 0;
		padding: 0.55rem;
		border-radius: 8px;
		background: #f5f7fc;
		white-space: pre-wrap;
		word-break: break-word;
		max-width: 520px;
		font-size: 0.78rem;
	}
</style>
