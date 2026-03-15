<script lang="ts">
	let { data, form } = $props();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const isCurrent = (sessionId: string) => data.currentSessionId === sessionId;

	const confirmRevoke = (event: SubmitEvent) => {
		if (!confirm('Revoke this session?')) {
			event.preventDefault();
		}
	};

	const confirmRevokeOthers = (event: SubmitEvent) => {
		if (!confirm('Revoke all other sessions?')) {
			event.preventDefault();
		}
	};
</script>

<section class="head">
	<h2>Security</h2>
	<p>Manage active sessions for your account.</p>
</section>

<section class="panel">
	<form method="POST" action="?/revokeOtherSessions" onsubmit={confirmRevokeOthers}>
		<button type="submit" class="secondary">Logout all other sessions</button>
	</form>
</section>

{#if form?.error}
	<p class="feedback error">{form.error}</p>
{/if}
{#if form?.success}
	<p class="feedback success">{form.success}</p>
{/if}

<section class="table-wrap">
	<table>
		<thead>
			<tr><th>Status</th><th>Created</th><th>Expires</th><th>IP</th><th>User agent</th><th>Action</th></tr>
		</thead>
		<tbody>
			{#if data.sessions.length === 0}
				<tr><td colspan="6" class="empty">No active sessions found.</td></tr>
			{:else}
				{#each data.sessions as row}
					<tr>
						<td>
							{#if isCurrent(row.id)}
								<span class="badge current">Current</span>
							{:else}
								<span class="badge">Active</span>
							{/if}
						</td>
						<td>{formatDateTime(row.createdAt)}</td>
						<td>{formatDateTime(row.expiresAt)}</td>
						<td>{row.ipAddress ?? 'N/A'}</td>
						<td class="ua">{row.userAgent ?? 'N/A'}</td>
						<td>
							{#if isCurrent(row.id)}
								<span class="muted">-</span>
							{:else}
								<form method="POST" action="?/revokeSession" onsubmit={confirmRevoke}>
									<input type="hidden" name="token" value={row.token} />
									<button type="submit" class="danger">Logout</button>
								</form>
							{/if}
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
	.panel {
		margin-top: 0.8rem;
		padding: 0.7rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.feedback {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.92rem;
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
	.table-wrap {
		margin-top: 0.8rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 900px;
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
	.empty {
		text-align: center;
		color: var(--text-soft);
	}
	.badge {
		display: inline-block;
		padding: 0.17rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		background: #eef3ff;
		color: #35558c;
	}
	.badge.current {
		background: #e8f8ef;
		color: var(--ok);
	}
	.ua {
		max-width: 280px;
		word-break: break-word;
	}
	button.secondary,
	button.danger {
		font: inherit;
		padding: 0.45rem 0.7rem;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid var(--border);
	}
	button.secondary {
		background: #eef3ff;
		border-color: #cad6f2;
		color: #35558c;
	}
	button.danger {
		background: #fff1f0;
		border-color: #fac5bf;
		color: #9f2418;
	}
	.muted {
		color: var(--text-soft);
	}
</style>
