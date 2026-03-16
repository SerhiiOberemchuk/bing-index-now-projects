<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const canManage = () => Boolean(data.canManage);
	let isBusy = $state(false);
	let activeAction = $state<string | null>(null);
	let selectedIds = $state<string[]>([]);
	let notification = $state<{ kind: 'success' | 'error'; title: string; message: string } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		selectedIds = data.discoveredUrls.filter((row) => row.selected).map((row) => row.id);
	});

	onDestroy(() => {
		if (toastTimer) clearTimeout(toastTimer);
	});

	const formValue = (key: string) => ((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';
	const actionsDisabled = () => isBusy || !canManage();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const showToast = (kind: 'success' | 'error', title: string, message: string) => {
		notification = { kind, title, message };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			notification = null;
		}, 6000);
	};

	const enhanceWithFeedback = (actionId: string, label: string) => {
		return () => {
			if (actionsDisabled()) return;
			isBusy = true;
			activeAction = actionId;
			notification = null;

			return async ({ result, update }: { result: { type: string; data?: unknown }; update: () => Promise<void> }) => {
				await update();
				isBusy = false;
				activeAction = null;

				if (result.type === 'success') {
					const data = (result.data ?? {}) as Record<string, unknown>;
					showToast('success', label, typeof data.success === 'string' ? data.success : `${label} completed.`);
					return;
				}

				if (result.type === 'failure') {
					const data = (result.data ?? {}) as Record<string, unknown>;
					showToast('error', label, typeof data.error === 'string' ? data.error : `${label} failed.`);
					return;
				}

				showToast('error', label, `${label} failed due to a server error.`);
			};
		};
	};

	const selectAllCheckboxes = () => {
		if (actionsDisabled()) return;
		selectedIds = data.discoveredUrls.map((row) => row.id);
	};

	const clearAllCheckboxes = () => {
		if (actionsDisabled()) return;
		selectedIds = [];
	};

	const confirmIndexing = (event: SubmitEvent) => {
		if (actionsDisabled()) {
			event.preventDefault();
			return;
		}
		if (!confirm('Are you sure you want to index selected URLs now?')) {
			event.preventDefault();
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

{#if notification}
	<div class="toast {notification.kind}" role="status" aria-live="polite">
		<strong>{notification.title}</strong>
		<p>{notification.message}</p>
	</div>
{/if}

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

<section class="grid">
	<article class="panel">
		<h3>Sitemap fetch</h3>
		<p class="muted">Auto mode reads <code>robots.txt</code>, discovers sitemap entries, and crawls sitemap trees.</p>
		<div class="row-actions">
			<form method="POST" use:enhance={enhanceWithFeedback('autoFetch', 'Auto fetch sitemap')} action="?/autoFetch">
				<button class="primary" type="submit" disabled={actionsDisabled()}>
					{#if activeAction === 'autoFetch'}<span class="spinner"></span>Working...{:else}Auto fetch sitemap{/if}
				</button>
			</form>
			<form method="POST" use:enhance={enhanceWithFeedback('fetchSitemap', 'Fetch sitemap URL')} action="?/fetchSitemap" class="manual-inline">
				<input name="sitemapUrl" type="url" placeholder={data.defaultSitemapUrl} value={formValue('sitemapUrl')} disabled={actionsDisabled()} />
				<button class="secondary" type="submit" disabled={actionsDisabled()}>
					{#if activeAction === 'fetchSitemap'}<span class="spinner dark"></span>Fetching...{:else}Fetch URL{/if}
				</button>
			</form>
		</div>
	</article>

	<article class="panel">
		<h3>Path-based selection</h3>
		<p class="muted">Use glob-like patterns: <code>/blog/*</code>, <code>/products/*</code>, <code>/blog/drafts/*</code>.</p>
		<form method="POST" use:enhance={enhanceWithFeedback('applyPaths', 'Apply path rules')} action="?/applyPaths" class="paths-form">
			<label for="includePaths">Include paths</label>
			<textarea id="includePaths" name="includePaths" rows="4" placeholder="/blog/*&#10;/products/*" disabled={actionsDisabled()}>{formValue('includePaths')}</textarea>

			<label for="excludePaths">Exclude paths</label>
			<textarea id="excludePaths" name="excludePaths" rows="3" placeholder="/blog/drafts/*" disabled={actionsDisabled()}>{formValue('excludePaths')}</textarea>

			<button class="secondary" type="submit" disabled={actionsDisabled()}>
				{#if activeAction === 'applyPaths'}<span class="spinner dark"></span>Applying...{:else}Apply path rules{/if}
			</button>
		</form>
	</article>
</section>

<section class="panel stats">
	<h3>Indexing actions</h3>
	<p class="muted">
		Total discovered: <strong>{data.totalDiscovered}</strong>, selected: <strong>{selectedIds.length}</strong>, indexed before: <strong>{data.indexedDiscovered}</strong>
	</p>
	<div class="row-actions">
		<button class="secondary" type="button" onclick={selectAllCheckboxes} disabled={actionsDisabled()}>Select all</button>
		<button class="secondary" type="button" onclick={clearAllCheckboxes} disabled={actionsDisabled()}>Clear selection</button>
	</div>
</section>

<section class="panel stats">
	<h3>Discovered URLs</h3>
	<p class="muted">Showing latest {data.discoveredUrls.length} records.</p>
	<form method="POST" action="?/indexSelected" use:enhance={enhanceWithFeedback('indexSelected', 'Index selected URLs')} onsubmit={confirmIndexing}>
		<div class="table-wrap">
			<table>
				<thead>
					<tr><th>Pick</th><th>URL</th><th>Lastmod</th><th>Last indexed</th><th>Updated</th></tr>
				</thead>
				<tbody>
					{#if data.discoveredUrls.length === 0}
						<tr><td colspan="5" class="empty">No URLs discovered yet.</td></tr>
					{:else}
						{#each data.discoveredUrls as row}
							<tr>
								<td>
									<input type="hidden" name="visibleIds" value={row.id} />
									<input type="checkbox" name="selectedIds" value={row.id} bind:group={selectedIds} disabled={actionsDisabled()} />
								</td>
								<td><a href={row.url} target="_blank" rel="noreferrer">{row.url}</a></td>
								<td>{formatDateTime(row.lastMod)}</td>
								<td>{formatDateTime(row.lastSubmittedAt)}{#if row.lastSubmittedAt}<span class="badge success">indexed</span>{:else}<span class="badge idle">not indexed yet</span>{/if}</td>
								<td>{formatDateTime(row.updatedAt)}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if data.discoveredUrls.length > 0}
			<div class="table-footer">
				<button class="primary" type="submit" disabled={actionsDisabled()}>
					{#if activeAction === 'indexSelected'}<span class="spinner"></span>Indexing...{:else}Index selected{/if}
				</button>
			</div>
		{/if}
	</form>
</section>

{#if form?.indexResult}
	<section class="panel stats">
		<h3>Latest indexing response</h3>
		<p class="muted">This is the immediate response from the last indexing request.</p>
		<pre>{stringify(form.indexResult)}</pre>
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
	.grid { display: grid; margin-top: 0.85rem; gap: 0.8rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
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
	.table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 10px; }
	table { width: 100%; border-collapse: collapse; min-width: 920px; }
	th, td { padding: 0.65rem; border-bottom: 1px solid var(--border); text-align: left; }
	th { font-size: 0.79rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-soft); }
	tbody tr:last-child td { border-bottom: 0; }
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
	.toast {
		position: fixed;
		top: 16px;
		right: 16px;
		max-width: 420px;
		z-index: 1000;
		padding: 0.7rem 0.8rem;
		border-radius: 10px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
	}
	.toast strong { display: block; margin: 0 0 0.2rem; }
	.toast p { margin: 0; font-size: 0.86rem; }
	.toast.success { background: #e8f8ef; color: #0f5132; border: 1px solid #b7e6cb; }
	.toast.error { background: #ffe8e8; color: #7a1220; border: 1px solid #ffd0d0; }
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
</style>


