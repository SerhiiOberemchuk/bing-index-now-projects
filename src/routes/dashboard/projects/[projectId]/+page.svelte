<script lang="ts">
	import { isFormBusy, managedForm } from '#lib/client/form-feedback.svelte.js';
	import { formatDateTime } from '#lib/format.js';
	import { describeBingResponse } from '#lib/indexnow-response.js';
	import { projectStatus } from '#lib/project-status.js';
	import { scheduleLabel } from '#lib/schedule.js';

	let { data, form } = $props();

	const canManage = $derived(Boolean(data.canManage));
	const isActive = $derived(data.project.status === 'active');
	const status = $derived(projectStatus(data.project, data.stats));
	const formValue = (key: string) =>
		((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';
</script>

<section class="head">
	<div>
		<a href="/dashboard/projects" class="back">← All sites</a>
		<h2>{data.project.name}</h2>
		<p><a href={`https://${data.project.domain}`} target="_blank" rel="noreferrer">{data.project.domain}</a></p>
	</div>
	<div class="head-actions">
		<form method="POST" action="?/toggleStatus" use:managedForm={{ id: 'toggleStatus', label: 'Update site status' }}>
			<button class="secondary" type="submit" disabled={!canManage || isFormBusy('toggleStatus')}>
				{isActive ? 'Pause' : 'Resume'}
			</button>
		</form>
	</div>
</section>

{#if !canManage}
	<p class="feedback warn">You have read-only access.</p>
{/if}

<section class="card status-card {status.tone}">
	<div class="status-line">
		<span class="pill {status.tone}">{status.text}</span>
		<form method="POST" action="?/sync" use:managedForm={{ id: 'sync', label: 'Check' }}>
			<button type="submit" class="primary" disabled={!canManage || !isActive || isFormBusy('sync')}>
				{isFormBusy('sync') ? 'Checking sitemap…' : 'Check sitemap and send new pages'}
			</button>
		</form>
	</div>

	<div class="numbers">
		<div>
			<span>Pages in sitemap</span>
			<strong>{data.stats.inSitemap}</strong>
		</div>
		<div>
			<span>Sent to Bing</span>
			<strong>{data.stats.sent}</strong>
		</div>
		<div class:waiting={data.stats.waiting > 0}>
			<span>Waiting to send</span>
			<strong>{data.stats.waiting}</strong>
		</div>
	</div>

	{#if data.lastSync}
		<div class="last-sync">
			<p>
				<strong>Last check:</strong>
				{formatDateTime(data.lastSync.at)}
				({data.lastSync.result.source === 'cron' ? 'automatic' : `by ${data.lastSync.by ?? 'user'}`})
			</p>
			<p class="tone-{data.lastSync.summary.tone}">{data.lastSync.summary.headline}</p>
			{#if data.lastSync.summary.notes.length > 0}
				<ul class="notes">
					{#each data.lastSync.summary.notes as note}
						<li>{note}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<p class="last-sync muted">Not checked yet. Press the button above to read the sitemap and send the pages.</p>
	{/if}
</section>

<section class="grid">
	<article class="card">
		<h3>Auto-check</h3>
		<p class="muted">
			How often the server reads the sitemap and sends new or changed pages. Pages Bing already received are not sent
			again.
		</p>
		<form
			method="POST"
			action="?/updateSchedule"
			class="inline-form"
			use:managedForm={{ id: 'updateSchedule', label: 'Save schedule' }}
		>
			<select name="schedule" value={data.project.schedule} disabled={!canManage || isFormBusy('updateSchedule')}>
				{#each data.scheduleOptions as option}
					<option value={option}>{scheduleLabel(option)}</option>
				{/each}
			</select>
			<button type="submit" class="secondary" disabled={!canManage || isFormBusy('updateSchedule')}>Save</button>
		</form>
		{#if data.project.schedule !== 'disabled' && isActive}
			<p class="muted">Next check: {formatDateTime(data.project.nextRunAt, 'on the next run (within 6 hours)')}</p>
		{/if}
	</article>

	<article class="card">
		<h3>Setup</h3>
		<dl>
			<div>
				<dt>Key file</dt>
				<dd>
					<a href={data.project.keyLocation} target="_blank" rel="noreferrer"><code>{data.project.keyLocation}</code></a>
					<small>Must stay online and contain only the key, or Bing answers 403.</small>
				</dd>
			</div>
			<div>
				<dt>Sitemaps</dt>
				<dd>
					{#if data.sitemaps.length === 0}
						<span class="muted">Found on the first check.</span>
					{:else}
						<ul class="sitemaps">
							{#each data.sitemaps as sitemap}
								<li>
									<span class="dot {sitemap.status === 'failed' ? 'error' : 'ok'}"></span>
									<span>{sitemap.url}</span>
									{#if sitemap.lastError}
										<small class="tone-error">{sitemap.lastError}</small>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</dd>
			</div>
		</dl>
	</article>
</section>

<section class="card">
	<h3>Sent to Bing</h3>
	<p class="muted">Every IndexNow request and Bing's answer. Open a row to see which pages were in it.</p>
	{#if data.submissions.length === 0}
		<p class="empty">Nothing sent yet.</p>
	{:else}
		<ul class="history">
			{#each data.submissions as row (row.id)}
				{@const bing = describeBingResponse(row.statusCode)}
				<li>
					<details>
						<summary>
							<span>{formatDateTime(row.createdAt)}</span>
							<span>{row.urlCount} pages</span>
							<span class="tone-{bing.tone}">{bing.text} (HTTP {row.statusCode ?? 'n/a'})</span>
						</summary>
						{#if row.responseBody}
							<pre>{row.responseBody}</pre>
						{/if}
						<ul class="url-list">
							{#each row.urls as url}
								<li>{url}</li>
							{/each}
						</ul>
						{#if row.urlCount > row.urls.length}
							<p class="muted">…and {row.urlCount - row.urls.length} more</p>
						{/if}
					</details>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="card">
	<h3>Pages</h3>
	<p class="muted">
		Pages from the sitemap. A page is sent again only when its <code>&lt;lastmod&gt;</code> in the sitemap is newer than
		the last send.
		{#if data.stats.inSitemap > data.pages.length}
			Showing {data.pages.length} of {data.stats.inSitemap}.
		{/if}
	</p>
	{#if data.pages.length === 0}
		<p class="empty">No pages yet. Run a check to read the sitemap.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Page</th>
						<th>Status</th>
						<th>Last modified</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pages as page (page.url)}
						<tr>
							<td class="url"><a href={page.url} target="_blank" rel="noreferrer">{page.url}</a></td>
							<td>
								{#if page.waiting}
									<span class="tone-warn">{page.lastSubmittedAt ? 'Changed, will be resent' : 'Waiting to send'}</span>
								{:else}
									Sent {formatDateTime(page.lastSubmittedAt)}
								{/if}
							</td>
							<td>{formatDateTime(page.lastMod, 'not set')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

{#if canManage}
	<section class="card">
		<details>
			<summary>Send specific URLs by hand</summary>
			<p class="muted">
				Normally not needed: the check above sends new pages. Use this for a page that is not in the sitemap. One URL per
				line, all on {data.project.domain}.
			</p>
			<form method="POST" action="?/submitUrls" class="stack" use:managedForm={{ id: 'submitUrls', label: 'Send URLs' }}>
				<textarea
					name="urlsText"
					rows="5"
					placeholder={`https://${data.project.domain}/page-1\nhttps://${data.project.domain}/page-2`}
					disabled={!isActive || isFormBusy('submitUrls')}>{formValue('urlsText')}</textarea
				>
				<button type="submit" class="secondary" disabled={!isActive || isFormBusy('submitUrls')}>
					{isFormBusy('submitUrls') ? 'Sending…' : 'Send to Bing'}
				</button>
			</form>
		</details>
	</section>

	<section class="card">
		<details>
			<summary>Delete site</summary>
			<p class="muted">Removes the site, its page list and its send history from this app. Nothing changes on the site or in Bing.</p>
			<form
				method="POST"
				action="?/deleteProject"
				use:managedForm={{
					id: 'deleteProject',
					label: 'Delete site',
					confirm: {
						title: `Delete ${data.project.domain}?`,
						description: 'The page list and send history will be removed.',
						actionLabel: 'Delete'
					}
				}}
			>
				<button type="submit" class="danger" disabled={isFormBusy('deleteProject')}>Delete site</button>
			</form>
		</details>
	</section>
{/if}

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 0.8rem;
	}

	h2,
	h3 {
		margin: 0;
	}

	h2 {
		margin-top: 0.35rem;
	}

	.head p {
		margin: 0.25rem 0 0;
		color: var(--text-soft);
	}

	.back {
		color: var(--text-soft);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.feedback.warn {
		margin: 0.75rem 0 0;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #fff4e8;
		color: var(--warn);
		border: 1px solid #ffd7b5;
	}

	.card {
		margin-top: 0.8rem;
		padding: 0.9rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	.grid {
		display: grid;
		gap: 0.8rem;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}

	.grid .card {
		margin-top: 0.8rem;
	}

	.status-card {
		border-left-width: 4px;
	}

	.status-card.ok {
		border-left-color: var(--ok);
	}

	.status-card.warn {
		border-left-color: var(--warn);
	}

	.status-card.error {
		border-left-color: var(--danger);
	}

	.status-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}

	.pill {
		display: inline-block;
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		font-size: 0.88rem;
		font-weight: 600;
	}

	.pill.ok {
		background: #e8f8ef;
		color: var(--ok);
	}

	.pill.warn {
		background: #fff4e8;
		color: var(--warn);
	}

	.pill.error {
		background: #ffe8e8;
		color: var(--danger);
	}

	.pill.muted {
		background: var(--surface-soft);
		color: var(--text-soft);
	}

	.numbers {
		margin-top: 0.8rem;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.55rem;
	}

	.numbers div {
		padding: 0.62rem;
		border-radius: 8px;
		background: var(--surface-soft);
	}

	.numbers span {
		display: block;
		color: var(--text-soft);
		font-size: 0.85rem;
	}

	.numbers strong {
		display: block;
		margin-top: 0.22rem;
		font-size: 1.35rem;
	}

	.numbers .waiting strong {
		color: var(--warn);
	}

	.last-sync {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.3rem;
		font-size: 0.92rem;
	}

	.last-sync p {
		margin: 0;
	}

	.notes {
		margin: 0.2rem 0 0;
		padding-left: 1.1rem;
		color: var(--warn);
		font-size: 0.88rem;
		display: grid;
		gap: 0.25rem;
	}

	.tone-ok {
		color: var(--ok);
	}

	.tone-warn {
		color: var(--warn);
	}

	.tone-error {
		color: var(--danger);
	}

	.muted,
	.empty {
		color: var(--text-soft);
		font-size: 0.88rem;
	}

	.card > .muted,
	.card > .empty {
		margin: 0.4rem 0 0.7rem;
	}

	.inline-form {
		display: flex;
		gap: 0.5rem;
	}

	.stack {
		display: grid;
		gap: 0.6rem;
	}

	select,
	textarea {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.55rem 0.65rem;
		font: inherit;
		background: #fff;
	}

	.primary,
	.secondary,
	.danger {
		padding: 0.55rem 0.85rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface-soft);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}

	.danger {
		background: #ffe8e8;
		border-color: #ffd0d0;
		color: var(--danger);
	}

	button:disabled,
	select:disabled,
	textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	dl {
		margin: 0.6rem 0 0;
		display: grid;
		gap: 0.7rem;
	}

	dl div {
		display: grid;
		grid-template-columns: 90px 1fr;
		gap: 0.5rem;
	}

	dt {
		color: var(--text-soft);
	}

	dd {
		margin: 0;
		display: grid;
		gap: 0.25rem;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	dd small {
		color: var(--text-soft);
	}

	.sitemaps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.3rem;
	}

	.sitemaps li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: 0 0 auto;
	}

	.dot.ok {
		background: var(--ok);
	}

	.dot.error {
		background: var(--danger);
	}

	.history {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}

	.history > li {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.5rem 0.65rem;
	}

	.history summary {
		cursor: pointer;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		font-size: 0.9rem;
	}

	summary {
		cursor: pointer;
		font-weight: 600;
	}

	.url-list {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.84rem;
		color: var(--text-soft);
		max-height: 260px;
		overflow: auto;
		overflow-wrap: anywhere;
	}

	pre {
		margin: 0.5rem 0 0;
		padding: 0.45rem;
		border-radius: 6px;
		background: #f5f7fc;
		font-size: 0.8rem;
		white-space: pre-wrap;
	}

	.table-wrap {
		max-height: 520px;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.86rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--surface-soft);
		font-weight: 600;
	}

	td.url {
		overflow-wrap: anywhere;
	}

	td.url a {
		text-decoration: none;
	}

	@media (max-width: 760px) {
		.head {
			flex-direction: column;
			align-items: start;
		}

		.numbers {
			grid-template-columns: 1fr;
		}

		dl div {
			grid-template-columns: 1fr;
		}
	}
</style>
