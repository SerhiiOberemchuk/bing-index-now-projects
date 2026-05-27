<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();

	const canManage = () => Boolean(data.canManage);
	const formValue = (key: string, fallback = '') =>
		((form as Record<string, unknown> | undefined)?.[key] as string | undefined) ?? fallback;

	const successCount = $derived(data.submissions.filter((row) => row.status === 'success').length);
	const successRate = $derived(
		data.submissions.length > 0 ? Math.round((successCount / data.submissions.length) * 100) : 0
	);

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

	const trim = (value: string | null, max = 220) => {
		if (!value) return '(empty response body)';
		return value.length > max ? `${value.slice(0, max)}...` : value;
	};

	const retryId = (id: string) => `retrySubmission:${id}`;
</script>

<section class="page-head">
	<div>
		<h2>Submissions</h2>
		<p>Recent IndexNow requests. Fix failed rows first; expand only when you need the payload.</p>
	</div>
	<form
		method="POST"
		action="?/retryFailedRecent"
		use:managedForm={{
			id: 'retryFailedRecent',
			label: 'Retry failed submissions',
			confirm: {
				title: 'Retry failed submissions?',
				description: 'The latest failed submissions in the selected window will be sent again.',
				actionLabel: 'Retry'
			}
		}}
		class="retry-all"
	>
		<input name="limit" type="number" min="1" max="100" value={formValue('limit', '20')} disabled={!canManage() || isFormBusy('retryFailedRecent')} />
		<button type="submit" disabled={!canManage() || data.failedInList === 0 || isFormBusy('retryFailedRecent')}>
			{isFormBusy('retryFailedRecent') ? 'Retrying...' : 'Retry failed'}
		</button>
	</form>
</section>

{#if !canManage()}
	<p class="feedback warn">Read-only access. Retry actions are disabled for your role.</p>
{/if}

{#if form?.error}
	<p class="feedback error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="feedback success">{form.success}</p>
{/if}

<section class="summary" aria-label="Submission summary">
	<article>
		<p>Recent records</p>
		<strong>{data.submissions.length}</strong>
	</article>
	<article class:attention={data.failedInList > 0}>
		<p>Failed</p>
		<strong>{data.failedInList}</strong>
	</article>
	<article>
		<p>Success rate</p>
		<strong>{data.submissions.length === 0 ? 'N/A' : `${successRate}%`}</strong>
	</article>
</section>

{#if form?.retryResult || form?.bulkResult}
	<section class="result-panel">
		<h3>Latest retry result</h3>
		<pre>{stringify(form.retryResult ?? form.bulkResult)}</pre>
	</section>
{/if}

<section class="submission-list">
	{#if data.submissions.length === 0}
		<p class="empty">No submissions yet.</p>
	{:else}
		{#each data.submissions as row}
			<article class="submission" class:failed={row.status === 'failed'}>
				<div class="row-main">
					<div>
						<h3>{row.projectDomain}</h3>
						<p>{formatDateTime(row.createdAt)} - {row.urlCount} URL{row.urlCount === 1 ? '' : 's'}</p>
					</div>
					<div class="row-actions">
						<span class="badge {row.status}">{row.status}</span>
						{#if row.status === 'failed'}
							<form
								method="POST"
								action="?/retrySubmission"
								use:managedForm={{
									id: retryId(row.id),
									label: 'Retry submission',
									confirm: {
										title: 'Retry this submission?',
										description: 'The failed URL payload will be sent to IndexNow again.',
										actionLabel: 'Retry'
									}
								}}
							>
								<input type="hidden" name="submissionId" value={row.id} />
								<button type="submit" class="retry" disabled={!canManage() || isFormBusy(retryId(row.id))}>
									{isFormBusy(retryId(row.id)) ? 'Retrying...' : 'Retry'}
								</button>
							</form>
						{/if}
						<a href={`/dashboard/projects/${row.projectId}`}>Project</a>
					</div>
				</div>

				<div class="meta">
					<span>HTTP: {row.responseStatusCode ?? 'N/A'}</span>
					<span>{trim(row.responseBody)}</span>
				</div>

				<details>
					<summary>Technical details</summary>
					<div class="details-content">
						<p><strong>Submission ID:</strong> <code>{row.id}</code></p>
						<p><strong>Full response body:</strong></p>
						<pre>{row.responseBody ?? '(empty response body)'}</pre>
						<p><strong>Sent payload:</strong></p>
						<pre>{stringify(row.payload)}</pre>
					</div>
				</details>
			</article>
		{/each}
	{/if}
</section>

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
	.empty {
		color: var(--text-soft);
	}

	.page-head p {
		margin-top: 0.35rem;
	}

	.retry-all {
		display: flex;
		gap: 0.45rem;
		align-items: center;
	}

	input,
	button,
	a {
		font: inherit;
		border-radius: 8px;
		border: 1px solid var(--border);
	}

	input {
		width: 82px;
		padding: 0.5rem 0.55rem;
	}

	button,
	a {
		padding: 0.52rem 0.72rem;
		text-decoration: none;
		background: var(--surface-soft);
		cursor: pointer;
	}

	button {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
		font-weight: 700;
	}

	button:disabled,
	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.feedback {
		margin-top: 0.75rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
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

	.summary {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 0.8rem;
	}

	.summary article,
	.result-panel,
	.submission {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.summary article {
		padding: 0.8rem;
	}

	.summary article.attention,
	.submission.failed {
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

	.result-panel {
		margin-top: 0.8rem;
		padding: 0.85rem;
	}

	.submission-list {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.65rem;
	}

	.empty {
		padding: 0.8rem;
		border: 1px dashed var(--border);
		border-radius: 8px;
	}

	.submission {
		padding: 0.85rem;
		display: grid;
		gap: 0.65rem;
	}

	.row-main,
	.row-actions,
	.meta {
		display: flex;
		gap: 0.55rem;
	}

	.row-main {
		justify-content: space-between;
		align-items: start;
	}

	.row-main h3 {
		font-size: 1rem;
	}

	.row-main p {
		margin-top: 0.25rem;
		color: var(--text-soft);
	}

	.row-actions {
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.row-actions form {
		margin: 0;
	}

	.meta {
		flex-direction: column;
		font-size: 0.88rem;
	}

	.badge {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.badge.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.failed {
		background: #ffe8e8;
		color: var(--danger);
	}

	.retry {
		background: #fff1f0;
		border-color: #fac5bf;
		color: #9f2418;
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
		font-size: 0.86rem;
	}

	pre {
		margin: 0;
		padding: 0.55rem;
		border-radius: 8px;
		background: #f5f7fc;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.78rem;
	}

	@media (max-width: 760px) {
		.page-head,
		.row-main {
			align-items: stretch;
			flex-direction: column;
		}

		.summary {
			grid-template-columns: 1fr;
		}

		.row-actions {
			justify-content: flex-start;
		}
	}
</style>
