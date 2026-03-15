<script lang="ts">
	let { data } = $props();

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
</script>

<section class="head">
	<h2>Audit log</h2>
	<p>Security and admin events for access management.</p>
</section>

{#if !data.isOwner}
	<p class="note warn">Only owner can view audit logs.</p>
{:else}
	<section class="table-wrap">
		<table>
			<thead>
				<tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th><th>Details</th></tr>
			</thead>
			<tbody>
				{#if data.events.length === 0}
					<tr><td colspan="6" class="empty">No audit events yet.</td></tr>
				{:else}
					{#each data.events as row}
						<tr>
							<td>{formatDateTime(row.createdAt)}</td>
							<td>{row.actorEmail ?? 'Unknown'}</td>
							<td><code>{row.action}</code></td>
							<td>{row.targetType ?? '-'} {row.targetId ?? ''}</td>
							<td>{row.ipAddress ?? 'N/A'}</td>
							<td>
								{#if row.metadata}
									<details>
										<summary>View</summary>
										<pre>{stringify(row.metadata)}</pre>
									</details>
								{:else}
									<span class="muted">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</section>
{/if}

<style>
	.head h2 { margin: 0; }
	.head p { margin: 0.35rem 0 0; color: var(--text-soft); }
	.note.warn {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}
	.table-wrap {
		margin-top: 0.9rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: auto;
	}
	table { width: 100%; border-collapse: collapse; min-width: 1060px; }
	th, td {
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
	.empty { text-align: center; color: var(--text-soft); }
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
	.muted { color: var(--text-soft); }
</style>
