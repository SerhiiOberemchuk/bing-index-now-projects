<script lang="ts">
	import { formatDateTime } from '#lib/format.js';
	import { describeBingResponse } from '#lib/indexnow-response.js';
	import { projectStatus } from '#lib/project-status.js';
	import { scheduleLabel } from '#lib/schedule.js';

	let { data } = $props();

	const autoCheckLabel = (row: { schedule: string; status: string; nextRunAt: Date | null }) =>
		row.schedule === 'disabled' || row.status !== 'active'
			? scheduleLabel(row.schedule)
			: `${scheduleLabel(row.schedule)}, next ${formatDateTime(row.nextRunAt, 'on the next run')}`;
</script>

<section class="page-head">
	<div>
		<h2>Sites</h2>
		<p>Every site's sitemap is checked automatically. New and changed pages are sent to Bing through IndexNow.</p>
	</div>
	{#if data.canManage}
		<a href="/dashboard/projects/new" class="primary">Add site</a>
	{/if}
</section>

<details class="how">
	<summary>How it works and what the numbers mean</summary>
	<ol>
		<li><strong>Check</strong>: the app reads the site's sitemap (from robots.txt, or /sitemap.xml).</li>
		<li>
			<strong>Send</strong>: pages that are new, or whose <code>&lt;lastmod&gt;</code> changed since the last send, go to
			Bing in one IndexNow request.
		</li>
		<li>
			<strong>Bing's answer</strong>: HTTP 200 or 202 means Bing <em>received</em> the list. It does not mean the pages
			are indexed: Bing decides when to crawl them. Check real indexing in Bing Webmaster Tools.
		</li>
	</ol>
	<p>
		IndexNow is shared with Yandex, Seznam, Naver and Yep. Google does not support it, so use Google Search Console for
		Google.
	</p>
</details>

{#if data.projects.length === 0}
	<section class="empty-state">
		<h3>No sites yet</h3>
		<p>Add a site, put the IndexNow key file on it, and the app will send its pages to Bing.</p>
		{#if data.canManage}
			<a href="/dashboard/projects/new" class="primary">Add first site</a>
		{/if}
	</section>
{:else}
	<section class="project-list">
		{#each data.projects as row (row.id)}
			{@const status = projectStatus(row, row.stats)}
			{@const last = row.stats.lastSubmission}
			<a class="project-card {status.tone}" href={`/dashboard/projects/${row.id}`}>
				<div class="card-main">
					<div>
						<h3>{row.name}</h3>
						<p>{row.domain}</p>
					</div>
					<span class="status {status.tone}">{status.text}</span>
				</div>

				<div class="signals">
					<div>
						<span>Pages in sitemap</span>
						<strong>{row.stats.inSitemap}</strong>
					</div>
					<div>
						<span>Sent to Bing</span>
						<strong>{row.stats.sent}</strong>
					</div>
					<div class:waiting={row.stats.waiting > 0}>
						<span>Waiting to send</span>
						<strong>{row.stats.waiting}</strong>
					</div>
				</div>

				<div class="meta">
					<p>
						Last send:
						{#if last}
							{formatDateTime(last.createdAt)}, {last.urlCount} pages,
							<span class:error={!last.ok}>{describeBingResponse(last.statusCode).text} (HTTP {last.statusCode ?? 'n/a'})</span>
						{:else}
							never
						{/if}
					</p>
					<p>Auto-check: {autoCheckLabel(row)}</p>
				</div>
			</a>
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
	.empty-state p,
	.how {
		color: var(--text-soft);
	}

	.page-head p {
		margin-top: 0.35rem;
	}

	.primary {
		text-decoration: none;
		border-radius: 8px;
		font-weight: 700;
		white-space: nowrap;
		padding: 0.58rem 0.85rem;
		background: var(--brand);
		border: 1px solid var(--brand);
		color: #fff;
	}

	.how {
		margin-top: 0.8rem;
		padding: 0.7rem 0.85rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.9rem;
	}

	.how summary {
		cursor: pointer;
		color: var(--brand);
		font-weight: 600;
	}

	.how ol {
		margin: 0.6rem 0 0.4rem;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.35rem;
	}

	.how strong {
		color: var(--text);
	}

	.empty-state,
	.project-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
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
		text-decoration: none;
		border-left-width: 4px;
	}

	.project-card:hover {
		border-color: var(--brand);
	}

	.project-card.ok {
		border-left-color: var(--ok);
	}

	.project-card.warn {
		border-left-color: var(--warn);
	}

	.project-card.error {
		border-left-color: var(--danger);
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

	.status {
		display: inline-block;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		font-size: 0.8rem;
		text-align: right;
	}

	.status.ok {
		background: #e8f8ef;
		color: var(--ok);
	}

	.status.warn {
		background: #fff4e8;
		color: var(--warn);
	}

	.status.error {
		background: #ffe8e8;
		color: var(--danger);
	}

	.status.muted {
		background: var(--surface-soft);
		color: var(--text-soft);
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

	.signals div.waiting strong {
		color: var(--warn);
	}

	.signals span,
	.signals strong {
		display: block;
	}

	.signals strong {
		margin-top: 0.22rem;
		font-size: 1.1rem;
	}

	.meta {
		display: grid;
		gap: 0.25rem;
		font-size: 0.88rem;
	}

	.meta .error {
		color: var(--danger);
	}

	@media (max-width: 760px) {
		.page-head,
		.card-main {
			align-items: stretch;
			flex-direction: column;
		}

		.signals {
			grid-template-columns: 1fr;
		}

		.status {
			text-align: left;
		}
	}
</style>
