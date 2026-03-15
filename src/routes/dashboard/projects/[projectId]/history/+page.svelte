<script lang="ts">
	let { data } = $props();

	const formatDateTime = (value: string | Date) => new Date(value).toLocaleString();

	const stringify = (value: unknown) => {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value ?? '');
		}
	};

	const kindLabel = (kind: string) => {
		switch (kind) {
			case 'submission':
				return 'Submission';
			case 'automation':
				return 'Automation';
			case 'sitemap_failed':
				return 'Sitemap';
			default:
				return 'Event';
		}
	};
</script>

<section class="head">
	<div>
		<h2>Project history</h2>
		<p>{data.project.name} - {data.project.domain}</p>
	</div>
	<div class="actions">
		<a href={`/dashboard/projects/${data.project.id}`}>Back to project</a>
		<a href={`/dashboard/projects/${data.project.id}/sitemap`}>Sitemap page</a>
	</div>
</section>

<section class="timeline">
	{#if data.history.length === 0}
		<p class="empty">No events yet.</p>
	{:else}
		{#each data.history as item}
			<article class="event {item.kind}">
				<div class="row-top">
					<span class="kind">{kindLabel(item.kind)}</span>
					<time>{formatDateTime(item.createdAt)}</time>
				</div>
				<h3>{item.title}</h3>
				<p>{item.description}</p>
				<details>
					<summary>Details</summary>
					<pre>{stringify(item.details)}</pre>
				</details>
			</article>
		{/each}
	{/if}
</section>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 0.7rem;
	}

	h2 { margin: 0; }
	.head p { margin: 0.35rem 0 0; color: var(--text-soft); }

	.actions { display: flex; gap: 0.45rem; flex-wrap: wrap; }
	.actions a {
		text-decoration: none;
		padding: 0.45rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface-soft);
	}

	.timeline {
		margin-top: 0.85rem;
		display: grid;
		gap: 0.65rem;
	}

	.event {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.75rem;
	}

	.event.submission { border-left: 4px solid #4e7bd3; }
	.event.automation { border-left: 4px solid #2aa775; }
	.event.sitemap_failed { border-left: 4px solid #d35a4e; }

	.row-top {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.82rem;
		color: var(--text-soft);
	}

	.kind {
		display: inline-block;
		padding: 0.16rem 0.45rem;
		border-radius: 999px;
		background: #eef3ff;
		color: #35558c;
	}

	h3 { margin: 0.45rem 0 0; font-size: 0.98rem; }
	p { margin: 0.35rem 0 0; color: var(--text-soft); }

	details { margin-top: 0.45rem; }
	summary { cursor: pointer; color: var(--brand); }
	pre {
		margin: 0.35rem 0 0;
		padding: 0.5rem;
		background: #f5f7fc;
		border-radius: 8px;
		font-size: 0.78rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.empty {
		padding: 0.8rem;
		border: 1px dashed var(--border);
		border-radius: 10px;
		color: var(--text-soft);
	}
</style>
