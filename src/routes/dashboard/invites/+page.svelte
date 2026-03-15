<script lang="ts">
	let { data, form } = $props();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const inviteLink = (token: string) => `${data.signUpBaseUrl}?invite=${token}`;
	const isExpired = (value: string | Date | null) => (value ? new Date(value).getTime() < Date.now() : false);
</script>

<section class="head">
	<h2>Invites</h2>
	<p>Create sign-up invites for specific emails.</p>
</section>

{#if !data.isOwner}
	<p class="feedback error">Only owner can manage invites.</p>
{:else}
	<section class="panel">
		<form method="POST" action="?/createInvite" class="create-form">
			<input type="email" name="email" placeholder="user@example.com" required />
			<select name="role">
				<option value="viewer">viewer</option>
				<option value="manager">manager</option>
			</select>
			<button type="submit" class="primary">Create invite</button>
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
				<tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th>Link</th><th>Action</th></tr>
			</thead>
			<tbody>
				{#if data.invites.length === 0}
					<tr><td colspan="6" class="empty">No invites yet.</td></tr>
				{:else}
					{#each data.invites as row}
						<tr>
							<td>{row.email}</td>
							<td><span class="badge">{row.role}</span></td>
							<td>
								{#if row.usedAt}
									<span class="badge ok">used</span>
								{:else if row.revokedAt}
									<span class="badge warn">revoked</span>
								{:else if isExpired(row.expiresAt)}
									<span class="badge warn">expired</span>
								{:else}
									<span class="badge live">active</span>
								{/if}
							</td>
							<td>{formatDateTime(row.expiresAt)}</td>
							<td><code>{inviteLink(row.token)}</code></td>
							<td>
								{#if !row.usedAt && !row.revokedAt}
									<form method="POST" action="?/revokeInvite">
										<input type="hidden" name="inviteId" value={row.id} />
										<button type="submit" class="danger">Revoke</button>
									</form>
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
	.panel {
		margin-top: 0.8rem;
		padding: 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
	}
	.create-form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.create-form input, .create-form select {
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		font: inherit;
	}
	button.primary, button.danger {
		font: inherit;
		padding: 0.45rem 0.7rem;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid var(--border);
	}
	button.primary { background: var(--brand); border-color: var(--brand); color: #fff; }
	button.danger { background: #fff1f0; border-color: #fac5bf; color: #9f2418; }
	.feedback {
		margin-top: 0.8rem;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		font-size: 0.92rem;
	}
	.feedback.error { background: #ffe8e8; border: 1px solid #ffd0d0; color: var(--danger); }
	.feedback.success { background: #e8f8ef; border: 1px solid #c7efd7; color: var(--ok); }
	.table-wrap {
		margin-top: 0.85rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: auto;
	}
	table { width: 100%; border-collapse: collapse; min-width: 980px; }
	th, td { padding: 0.7rem; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
	th { font-size: 0.79rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-soft); }
	.empty { text-align: center; color: var(--text-soft); }
	.badge {
		display: inline-block;
		padding: 0.16rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		background: #eef3ff;
		color: #35558c;
		text-transform: lowercase;
	}
	.badge.ok { background: #e8f8ef; color: var(--ok); }
	.badge.warn { background: #fff4e8; color: var(--warn); }
	.badge.live { background: #eef3ff; color: #35558c; }
	code { white-space: nowrap; }
	.muted { color: var(--text-soft); }
</style>
