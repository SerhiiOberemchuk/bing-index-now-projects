<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();
	const canManage = () => Boolean(data.canManage);
	const formValue = (key: string) =>
		((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';

	const normalizeDomain = (input: string) =>
		input
			.trim()
			.toLowerCase()
			.replace(/^https?:\/\//, '')
			.split('/')[0]
			.replace(/\/+$/g, '');

	const projectDomain = () => normalizeDomain(data.project.domain);
	const keyLocation = () => `https://${projectDomain()}/${data.project.indexNowKey}.txt`;

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};


	const trimBody = (body: string | null) => {
		if (!body) return '';
		return body.length > 160 ? `${body.slice(0, 160)}...` : body;
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
				return 'Warning';
			case 'paused':
				return 'Paused';
			case 'setup_required':
				return 'Setup required';
			default:
				return 'Active';
		}
	};

	const healthHint = () => {
		switch (data.health.status) {
			case 'healthy':
				return 'Automation is stable. No pending selected URLs for indexing.';
			case 'warning':
				return 'Recent failures detected. Review details and run retry or run automation now.';
			case 'paused':
				return 'Project is paused. Automation and indexing are stopped.';
			case 'setup_required':
				return 'No discovered URLs yet. Fetch sitemap data first.';
			default:
				return 'Project is active and waiting for the next run.';
		}
	};
</script>

<section class="head">
	<div>
		<h2>Project details</h2>
		<p>{data.project.name} - {projectDomain()}</p>
	</div>
	<div class="head-actions">
		<span class="status {data.project.status}">{data.project.status}</span>
		<form method="POST" action="?/toggleStatus" use:managedForm={{ id: 'toggleStatus', label: 'Update project status' }}>
			<button class="toggle" type="submit" disabled={!canManage() || isFormBusy('toggleStatus')}>
				{data.project.status === 'active' ? 'Pause project' : 'Resume project'}
			</button>
		</form>
		<a href={'/dashboard/projects/' + data.project.id + '/history'} class="back">History</a>
		<a href={`/dashboard/projects/${data.project.id}/sitemap`} class="back">Sitemap</a>
		<a href="/dashboard/projects" class="back">Back to projects</a>
	</div>
</section>

{#if !canManage()}
	<p class="feedback warn">You have read-only access. Indexing and project status changes are disabled.</p>
{/if}

{#if form?.error}
	<p class="feedback error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="feedback success">{form.success}</p>
{/if}

{#if form?.automationResult}
	<section class="automation-result">
		<h3>Last automation result</h3>
		<div class="result-grid">
			<p><strong>Sitemaps:</strong> {form.automationResult.sitemapsSucceeded}/{form.automationResult.sitemapsTried}</p>
			<p><strong>Discovered URLs processed:</strong> {form.automationResult.discoveredUrlsProcessed}</p>
			<p><strong>Selected URLs for indexing:</strong> {form.automationResult.selectedUrlsForIndexing}</p>
			<p><strong>Batches:</strong> {form.automationResult.submissionBatches}</p>
			<p><strong>Successful batches:</strong> {form.automationResult.submissionSucceeded}</p>
			<p><strong>Failed batches:</strong> {form.automationResult.submissionFailed}</p>
		</div>
		{#if form.automationResult.errors?.length}
			<h4>Errors</h4>
			<ul class="error-list">
				{#each form.automationResult.errors as item}
					<li>{item}</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}
<section class="health-panel">
	<div class="health-head">
		<h3>Project health</h3>
		<span class="health-badge {data.health.status}">{healthLabel(data.health.status)}</span>
	</div>
	<p class="muted">{healthHint()}</p>
	<div class="health-grid">
		<p><strong>Discovered URLs:</strong> {data.health.discoveredTotal}</p>
		<p><strong>Selected URLs:</strong> {data.health.discoveredSelected}</p>
		<p><strong>Pending indexing:</strong> {data.health.pendingIndexing}</p>
		<p><strong>Last successful submission:</strong> {formatDateTime(data.health.latestSuccessAt)}</p>
		<p><strong>Last failed submission:</strong> {formatDateTime(data.health.latestFailureAt)}</p>
		<p><strong>Last failure HTTP:</strong> {data.health.latestFailureCode ?? 'N/A'}</p>
	</div>
	{#if data.health.latestFailureBody}
		<details>
			<summary>Last failure response body</summary>
			<pre>{data.health.latestFailureBody}</pre>
		</details>
	{/if}
	{#if data.health.latestSitemapFailure}
		<details>
			<summary>Last sitemap failure</summary>
			<p><strong>Time:</strong> {formatDateTime(data.health.latestSitemapFailure.updatedAt)}</p>
			<p><strong>Sitemap:</strong> {data.health.latestSitemapFailure.url}</p>
			<p><strong>Error:</strong> {data.health.latestSitemapFailure.lastError ?? 'Unknown error'}</p>
		</details>
	{/if}
</section>
<section class="metrics">
	<article>
		<p>Total submissions</p>
		<strong>{data.metrics.totalSubmissions}</strong>
	</article>
	<article>
		<p>Failed submissions</p>
		<strong>{data.metrics.failedSubmissions}</strong>
	</article>
	<article>
		<p>Submitted URLs in last 24h</p>
		<strong>{data.metrics.submissionsLast24h}</strong>
	</article>
	<article>
		<p>Average response code</p>
		<strong>{data.metrics.averageStatusCode ?? 'N/A'}</strong>
	</article>
</section>

<section class="panel-grid">
	<article class="panel">
		<h3>Submit URLs to Bing IndexNow</h3>
		<p class="muted">Paste one URL per line or separate by comma.</p>
		<form method="POST" action="?/submitUrls" class="submit-form" use:managedForm={{ id: 'submitUrls', label: 'Submit URLs' }}>
			<textarea
				name="urlsText"
				rows="8"
				placeholder={`https://${projectDomain()}/page-1\nhttps://${projectDomain()}/page-2`}
				disabled={!canManage() || isFormBusy('submitUrls')}
			>{formValue('urlsText')}</textarea>
			<button type="submit" class="primary" disabled={!canManage() || isFormBusy('submitUrls')}>
				{isFormBusy('submitUrls') ? 'Submitting...' : 'Submit URLs'}
			</button>
		</form>

		<dl>
			<div><dt>Domain</dt><dd>{projectDomain()}</dd></div>
			<div><dt>Key location</dt><dd><code>{keyLocation()}</code></dd></div>
			<div><dt>Schedule</dt><dd>{scheduleLabel(data.project.schedule)}</dd></div>
			<div><dt>Next run</dt><dd>{formatDateTime(data.project.nextRunAt)}</dd></div>
			<div><dt>Last automation run</dt><dd>{formatDateTime(data.project.lastAutomationRunAt)}</dd></div>
			<div><dt>Created at</dt><dd>{formatDateTime(data.project.createdAt)}</dd></div>
		</dl>
	</article>

	<article class="panel">
		<h3>Automation schedule</h3>
		<p class="muted">The selected schedule controls automatic sitemap sync and indexing runs.</p>
		<form method="POST" action="?/updateSchedule" class="schedule-form" use:managedForm={{ id: 'updateSchedule', label: 'Save schedule' }}>
			<label for="schedule">Schedule</label>
			<select id="schedule" name="schedule" value={data.project.schedule} disabled={!canManage() || isFormBusy('updateSchedule')}>
				{#each data.scheduleOptions as option}
					<option value={option}>{scheduleLabel(option)}</option>
				{/each}
			</select>
			<button type="submit" class="primary" disabled={!canManage() || isFormBusy('updateSchedule')}>
				{isFormBusy('updateSchedule') ? 'Saving...' : 'Save schedule'}
			</button>
		</form>
		<form
			method="POST"
			action="?/runAutomationNow"
			class="run-now-form"
			use:managedForm={{
				id: 'runAutomationNow',
				label: 'Run automation',
				confirm: {
					title: 'Run automation now?',
					description: 'This will fetch sitemap data and submit selected URLs for this project.',
					actionLabel: 'Run now'
				}
			}}
		>
			<button
				type="submit"
				class="primary"
				disabled={!canManage() || data.project.status !== 'active' || isFormBusy('runAutomationNow')}
			>
				{isFormBusy('runAutomationNow') ? 'Running...' : 'Run now'}
			</button>
		</form>
	</article>

	<article class="panel">
		<h3>Recent submissions</h3>
		{#if data.submissions.length === 0}
			<p class="empty">No submissions for this project yet.</p>
		{:else}
			<ul>
				{#each data.submissions as row}
					<li>
						<div class="row-top">
							<span>{formatDateTime(row.createdAt)}</span>
							<span class="status {row.status}">{row.status}</span>
						</div>
						<div class="row-meta">{row.urlCount} URLs - HTTP {row.responseStatusCode ?? 'N/A'}</div>
						{#if row.responseBody}
							<pre>{trimBody(row.responseBody)}</pre>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</section>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 0.8rem;
	}

	h2 {
		margin: 0;
	}

	.head p {
		margin: 0.35rem 0 0;
		color: var(--text-soft);
	}

	.head-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.feedback {
		margin: 0.75rem 0 0;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.92rem;
	}

	.feedback.warn {
		background: #fff4e8;
		color: #c65f00;
		border: 1px solid #ffd7b5;
	}

	.feedback.error {
		background: #ffe8e8;
		color: var(--danger);
		border: 1px solid #ffd0d0;
	}

	.feedback.success {
		background: #e8f8ef;
		color: var(--ok);
		border: 1px solid #c7efd7;
	}

	.automation-result {
		margin-top: 0.8rem;
		padding: 0.85rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--surface);
	}

	.automation-result h3 {
		margin: 0;
		font-size: 1rem;
	}

	.automation-result h4 {
		margin: 0.7rem 0 0.35rem;
		font-size: 0.88rem;
		color: var(--text-soft);
	}

	.result-grid {
		margin-top: 0.5rem;
		display: grid;
		gap: 0.35rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.result-grid p {
		margin: 0;
		font-size: 0.9rem;
	}

	.error-list {
		margin: 0;
		padding-left: 1rem;
		display: grid;
		gap: 0.3rem;
		color: var(--danger);
		font-size: 0.85rem;
	}

	.health-panel {
		margin-top: 0.8rem;
		padding: 0.85rem;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--surface);
	}

	.health-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.health-head h3 {
		margin: 0;
		font-size: 1rem;
	}

	.health-badge {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.78rem;
	}

	.health-badge.healthy {
		background: #e8f8ef;
		color: var(--ok);
	}

	.health-badge.warning {
		background: #fff4e8;
		color: var(--warn);
	}

	.health-badge.paused,
	.health-badge.setup_required {
		background: #ffe8e8;
		color: var(--danger);
	}

	.health-badge.active {
		background: #eef3ff;
		color: #35558c;
	}

	.health-grid {
		margin-top: 0.5rem;
		display: grid;
		gap: 0.35rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.health-grid p {
		margin: 0;
		font-size: 0.9rem;
	}

	.health-panel details {
		margin-top: 0.55rem;
	}

	.health-panel summary {
		cursor: pointer;
		color: var(--brand);
	}

	.health-panel details p {
		margin: 0.35rem 0 0;
		font-size: 0.88rem;
	}
	.status {
		display: inline-block;
		padding: 0.17rem 0.48rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.status.active,
	.status.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.status.paused {
		background: #fff4e8;
		color: var(--warn);
	}

	.status.failed {
		background: #ffe8e8;
		color: var(--danger);
	}

	.toggle,
	.back,
	.primary {
		text-decoration: none;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface-soft);
		font: inherit;
		cursor: pointer;
	}

	.toggle:disabled,
	.primary:disabled,
	textarea:disabled,
	select:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}

	.primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}

	.metrics {
		display: grid;
		gap: 0.8rem;
		margin-top: 0.9rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.metrics article {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.8rem;
	}

	.metrics p {
		margin: 0;
		font-size: 0.82rem;
		color: var(--text-soft);
	}

	.metrics strong {
		display: block;
		margin-top: 0.4rem;
		font-size: 1.25rem;
	}

	.panel-grid {
		display: grid;
		gap: 0.8rem;
		margin-top: 0.9rem;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}

	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.9rem;
	}

	h3 {
		margin: 0;
	}

	.muted {
		margin: 0.55rem 0 0.75rem;
		color: var(--text-soft);
		font-size: 0.88rem;
	}

	.submit-form,
	.schedule-form,
	.run-now-form {
		display: grid;
		gap: 0.65rem;
	}

	.schedule-form label {
		font-size: 0.88rem;
		color: var(--text-soft);
	}

	textarea,
	select {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.65rem;
		font: inherit;
	}

	dl {
		margin: 0.8rem 0 0;
		display: grid;
		gap: 0.5rem;
	}

	dl div {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 0.5rem;
	}

	dt {
		color: var(--text-soft);
	}

	dd {
		margin: 0;
	}

	.empty {
		margin: 0.8rem 0 0;
		color: var(--text-soft);
	}

	ul {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}

	li {
		padding: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.row-top {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.88rem;
	}

	.row-meta {
		margin-top: 0.35rem;
		font-size: 0.86rem;
		color: var(--text-soft);
	}

	pre {
		margin: 0.45rem 0 0;
		padding: 0.45rem;
		border-radius: 6px;
		background: #f5f7fc;
		font-size: 0.8rem;
		white-space: pre-wrap;
	}

	@media (max-width: 760px) {
		.head {
			flex-direction: column;
			align-items: start;
		}

		.head-actions {
			flex-wrap: wrap;
		}
	}
</style>






