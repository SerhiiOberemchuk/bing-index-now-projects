<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();
	const canManage = () => Boolean(data.canManage);
	let selectedIds = $state<string[]>([]);

	$effect(() => {
		selectedIds = data.discoveredUrls.filter((row) => row.selected).map((row) => row.id);
	});

	const formValue = (key: string) => ((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';
	const actionsDisabled = () => !canManage() || isFormBusy('autoFetch') || isFormBusy('fetchSitemap') || isFormBusy('applyPaths') || isFormBusy('indexSelected');

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const selectAllCheckboxes = () => {
		if (actionsDisabled()) return;
		selectedIds = data.discoveredUrls.map((row) => row.id);
	};

	const clearAllCheckboxes = () => {
		if (actionsDisabled()) return;
		selectedIds = [];
	};

	const guardIndexing = (event: SubmitEvent) => {
		if (actionsDisabled()) {
			event.preventDefault();
			return;
		}

		if (selectedIds.length === 0) {
			event.preventDefault();
			toast.error('Select at least one URL before indexing.');
		}
	};

	const stringify = (value: unknown) => {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value ?? '');
		}
	};
</script>

<section class="head">
	<div>
		<h2>Sitemap automation</h2>
		<p>{data.project.name} - {data.project.domain}</p>
	</div>
	<div class="actions-inline">
		<a href={`/dashboard/projects/${data.project.id}`}>Back to project</a>
	</div>
</section>

{#if !canManage()}
	<p class="feedback warn">You have read-only access. Fetch, selection, and indexing actions are disabled.</p>
{/if}

{#if form?.error}
	<p class="feedback error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="feedback success">{form.success}</p>
{/if}

<section class="action-grid">
	<article class="panel">
		<h3>Sitemap fetch</h3>
		<p class="muted">Find URLs from robots.txt and sitemap files.</p>
		<div class="row-actions">
			<form method="POST" use:managedForm={{ id: 'autoFetch', label: 'Auto fetch sitemap' }} action="?/autoFetch">
				<button class="primary" type="submit" disabled={actionsDisabled()}>
					{#if isFormBusy('autoFetch')}<span class="spinner"></span>Working...{:else}Auto fetch sitemap{/if}
				</button>
			</form>
			<form method="POST" use:managedForm={{ id: 'fetchSitemap', label: 'Fetch sitemap URL' }} action="?/fetchSitemap" class="manual-inline">
				<input name="sitemapUrl" type="url" placeholder={data.defaultSitemapUrl} value={formValue('sitemapUrl')} disabled={actionsDisabled()} />
				<button class="secondary" type="submit" disabled={actionsDisabled()}>
					{#if isFormBusy('fetchSitemap')}<span class="spinner dark"></span>Fetching...{:else}Fetch URL{/if}
				</button>
			</form>
		</div>
	</article>

	<article class="panel">
		<h3>Selection rules</h3>
		<p class="muted">Select only the URL groups you want to send to IndexNow.</p>
		<form method="POST" use:managedForm={{ id: 'applyPaths', label: 'Apply path rules' }} action="?/applyPaths" class="paths-form">
			<label for="includePaths">Include paths</label>
			<textarea id="includePaths" name="includePaths" rows="4" placeholder="/blog/*&#10;/products/*" disabled={actionsDisabled()}>{formValue('includePaths')}</textarea>

			<label for="excludePaths">Exclude paths</label>
			<textarea id="excludePaths" name="excludePaths" rows="3" placeholder="/blog/drafts/*" disabled={actionsDisabled()}>{formValue('excludePaths')}</textarea>

			<button class="secondary" type="submit" disabled={actionsDisabled()}>
				{#if isFormBusy('applyPaths')}<span class="spinner dark"></span>Applying...{:else}Apply path rules{/if}
			</button>
		</form>
	</article>
</section>

<section class="panel stats">
	<div class="index-head">
		<div>
			<h3>Discovered URLs</h3>
			<p class="muted">
				<strong>{data.totalDiscovered}</strong> found, <strong>{selectedIds.length}</strong> selected,
				<strong>{data.indexedDiscovered}</strong> indexed before.
			</p>
		</div>
		<div class="row-actions">
			<button class="secondary" type="button" onclick={selectAllCheckboxes} disabled={actionsDisabled()}>Select all</button>
			<button class="secondary" type="button" onclick={clearAllCheckboxes} disabled={actionsDisabled()}>Clear</button>
		</div>
	</div>

	<form method="POST" action="?/indexSelected" use:managedForm={{ id: 'indexSelected', label: 'Index selected URLs' }} onsubmit={guardIndexing}>
		{#if data.discoveredUrls.length === 0}
			<p class="empty">No URLs discovered yet.</p>
		{:else}
			<div class="url-list">
				{#each data.discoveredUrls as row}
					<label class="url-row">
						<input type="hidden" name="visibleIds" value={row.id} />
						<input type="checkbox" name="selectedIds" value={row.id} bind:group={selectedIds} disabled={actionsDisabled()} />
						<span class="url-main">
							<a href={row.url} target="_blank" rel="noreferrer">{row.url}</a>
							<small>
								Last indexed: {formatDateTime(row.lastSubmittedAt)}
								{#if row.lastMod} · Lastmod: {formatDateTime(row.lastMod)}{/if}
							</small>
						</span>
						{#if row.lastSubmittedAt}
							<span class="badge success">indexed</span>
						{:else}
							<span class="badge idle">not indexed</span>
						{/if}
					</label>
				{/each}
			</div>
			<div class="table-footer">
				<button class="primary" type="submit" disabled={actionsDisabled() || selectedIds.length === 0}>
					{#if isFormBusy('indexSelected')}<span class="spinner"></span>Indexing...{:else}Index {selectedIds.length} selected{/if}
				</button>
			</div>
		{/if}
	</form>
</section>

{#if form?.indexResult}
	<section class="panel stats">
		<details>
			<summary>Latest indexing response</summary>
			<pre>{stringify(form.indexResult)}</pre>
		</details>
	</section>
{/if}

<section class="panel">
	<h3>Sitemap sources</h3>
	<ul class="sources">
		{#if data.sitemaps.length === 0}
			<li class="empty">No sitemap sources fetched yet.</li>
		{:else}
			{#each data.sitemaps as item}
				<li>
					<div>
						<a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
						<p>{formatDateTime(item.lastFetchedAt)}</p>
					</div>
					<span class="badge {item.status}">{item.status}</span>
				</li>
			{/each}
		{/if}
	</ul>
</section>

<style>
	.head { display: flex; justify-content: space-between; align-items: end; gap: 0.75rem; }
	h2 { margin: 0; }
	.head p { margin: 0.35rem 0 0; color: var(--text-soft); }
	.actions-inline a { text-decoration: none; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface-soft); }
	.feedback { margin-top: 0.75rem; padding: 0.55rem 0.7rem; border-radius: 8px; }
	.feedback.warn { background: #fff4e8; border: 1px solid #ffd7b5; color: #c65f00; }
	.feedback.error { background: #ffe8e8; border: 1px solid #ffd0d0; color: var(--danger); }
	.feedback.success { background: #e8f8ef; border: 1px solid #c7efd7; color: var(--ok); }
	.action-grid { display: grid; margin-top: 0.85rem; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
	.panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 0.9rem; }
	h3 { margin: 0; }
	.muted { margin: 0.5rem 0 0.75rem; color: var(--text-soft); font-size: 0.88rem; }
	.row-actions { display: flex; flex-wrap: wrap; gap: 0.55rem; align-items: center; }
	button { font: inherit; cursor: pointer; padding: 0.52rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); transition: transform 0.15s ease, filter 0.15s ease; }
	button.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
	button.secondary { background: var(--surface-soft); }
	button:hover:not(:disabled) { filter: brightness(0.97); transform: translateY(-1px); }
	button:disabled { opacity: 0.7; cursor: not-allowed; }
	.manual-inline { display: flex; gap: 0.5rem; align-items: center; }
	.manual-inline input { min-width: 280px; }
	.paths-form { display: grid; gap: 0.45rem; }
	label { font-size: 0.86rem; color: var(--text-soft); }
	input, textarea { padding: 0.58rem 0.62rem; border: 1px solid var(--border); border-radius: 8px; font: inherit; }
	.stats { margin-top: 0.85rem; }
	.index-head { display: flex; justify-content: space-between; align-items: start; gap: 0.75rem; }
	.url-list { display: grid; gap: 0.45rem; margin-top: 0.75rem; }
	.url-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: 0.65rem;
		align-items: center;
		padding: 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: #fff;
	}
	.url-row input[type='checkbox'] { width: 18px; height: 18px; padding: 0; }
	.url-main { min-width: 0; display: grid; gap: 0.2rem; }
	.url-main a { overflow-wrap: anywhere; }
	.url-main small { color: var(--text-soft); }
	.table-footer { margin-top: 0.6rem; display: flex; justify-content: flex-end; }
	.empty { text-align: center; color: var(--text-soft); }
	pre { margin: 0; padding: 0.55rem; border-radius: 8px; background: #f5f7fc; white-space: pre-wrap; word-break: break-word; font-size: 0.78rem; }
	.sources { list-style: none; padding: 0; margin: 0.75rem 0 0; display: grid; gap: 0.5rem; }
	.sources li { display: flex; justify-content: space-between; align-items: start; gap: 0.6rem; padding: 0.6rem; border: 1px solid var(--border); border-radius: 8px; }
	.sources p { margin: 0.25rem 0 0; font-size: 0.82rem; color: var(--text-soft); }
	.badge { margin-left: 0.35rem; padding: 0.17rem 0.45rem; border-radius: 999px; font-size: 0.76rem; text-transform: capitalize; }
	.badge.success { background: #e8f8ef; color: var(--ok); }
	.badge.failed { background: #ffe8e8; color: var(--danger); }
	.badge.idle { background: #eef3ff; color: #35558c; }
	summary { cursor: pointer; color: var(--brand); font-weight: 700; }
	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.45);
		border-top-color: #fff;
		border-radius: 50%;
		margin-right: 0.45rem;
		vertical-align: -1px;
		animation: spin 0.8s linear infinite;
	}
	.spinner.dark {
		border-color: rgba(22, 38, 68, 0.25);
		border-top-color: #162644;
	}
	@keyframes spin { to { transform: rotate(360deg); } }
	@media (max-width: 760px) {
		.head,
		.index-head {
			align-items: stretch;
			flex-direction: column;
		}

		.manual-inline {
			align-items: stretch;
			flex-direction: column;
		}

		.manual-inline input {
			min-width: 0;
			width: 100%;
		}

		.url-row {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.url-row .badge {
			grid-column: 2;
			justify-self: start;
			margin-left: 0;
		}
	}
</style>


