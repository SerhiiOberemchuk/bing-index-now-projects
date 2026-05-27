<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'N/A';
		return new Date(value).toLocaleString();
	};

	const isOwnerRow = (role: string) => role === 'owner';
	const approvalId = (userId: string) => `approval:${userId}`;
	const roleId = (userId: string) => `role:${userId}`;
</script>

<section class="page-head">
	<div>
		<h2>Settings</h2>
		<p>Manage who can access the platform. Operational defaults are handled inside each project.</p>
	</div>
</section>

<section class="grid">
	<article class="panel">
		<h2>Access control</h2>
		{#if !data.isOwner}
			<p class="note warn">You have read-only access. Only owner can manage team roles and approvals.</p>
		{:else}
			<p class="note">Approve new users and manage roles for this workspace.</p>

			<div class="summary-row">
				<span class="chip warn">Pending verified: {data.stats.pendingVerified}</span>
				<span class="chip muted">Pending unverified: {data.stats.pendingUnverified}</span>
				<span class="chip success">Approved: {data.stats.approved}</span>
				<form method="POST" action="?/approveAllVerified" use:managedForm={{ id: 'approveAllVerified', label: 'Approve all verified users' }}>
					<button type="submit" class="secondary" disabled={data.stats.pendingVerified === 0 || isFormBusy('approveAllVerified')}>
						{isFormBusy('approveAllVerified') ? 'Approving...' : 'Approve all verified'}
					</button>
				</form>
			</div>

			{#if form?.error}
				<p class="note error">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="note success">{form.success}</p>
			{/if}
			<div class="table-wrap">
				<table>
					<thead>
						<tr><th>User</th><th>Email</th><th>Verification</th><th>Approval</th><th>Role</th><th>Created</th><th>Actions</th></tr>
					</thead>
					<tbody>
						{#if data.users.length === 0}
							<tr><td colspan="7" class="empty">No users found.</td></tr>
						{:else}
							{#each data.users as row}
								<tr>
									<td>{row.name}</td>
									<td>{row.email}</td>
									<td>
										{#if row.emailVerified}<span class="badge success">verified</span>{:else}<span class="badge warn">pending verify</span>{/if}
									</td>
									<td>
										{#if row.approved}<span class="badge success">approved</span>{:else}<span class="badge warn">pending owner</span>{/if}
									</td>
									<td><span class="badge role">{row.role}</span></td>
									<td>{formatDateTime(row.createdAt)}</td>
									<td>
										{#if isOwnerRow(row.role)}
											<span class="lock">Owner</span>
										{:else}
											<div class="actions-col">
												<form method="POST" action="?/updateApproval" class="inline-form" use:managedForm={{ id: approvalId(row.id), label: 'Update user approval' }}>
													<input type="hidden" name="userId" value={row.id} />
													<input type="hidden" name="approved" value={row.approved ? 'false' : 'true'} />
													<button type="submit" class={row.approved ? 'danger' : 'secondary'} disabled={isFormBusy(approvalId(row.id))}>
														{isFormBusy(approvalId(row.id)) ? 'Saving...' : row.approved ? 'Revoke' : 'Approve'}
													</button>
												</form>
												<form method="POST" action="?/updateRole" class="inline-form" use:managedForm={{ id: roleId(row.id), label: 'Update user role' }}>
													<input type="hidden" name="userId" value={row.id} />
													<select name="role" disabled={isFormBusy(roleId(row.id))}>
														<option value="manager" selected={row.role === 'manager'}>manager</option>
														<option value="viewer" selected={row.role === 'viewer'}>viewer</option>
													</select>
													<button type="submit" class="primary" disabled={isFormBusy(roleId(row.id))}>
														{isFormBusy(roleId(row.id)) ? 'Saving...' : 'Role'}
													</button>
												</form>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</article>

</section>

<style>
	.page-head {
		margin-bottom: 0.85rem;
	}

	.page-head h2,
	.page-head p {
		margin: 0;
	}

	.page-head p {
		margin-top: 0.35rem;
		color: var(--text-soft);
	}

	.grid {
		display: grid;
		gap: 0.85rem;
		grid-template-columns: 1fr;
	}

	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1rem;
		display: grid;
		gap: 0.8rem;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
	}

	.note {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-soft);
	}

	.note.warn {
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #fff4e8;
		border: 1px solid #ffd7b5;
		color: #c65f00;
	}

	.note.error {
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #ffe8e8;
		border: 1px solid #ffd0d0;
		color: var(--danger);
	}

	.note.success {
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		background: #e8f8ef;
		border: 1px solid #c7efd7;
		color: var(--ok);
	}

	.summary-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-items: center;
	}

	.chip {
		display: inline-block;
		padding: 0.22rem 0.5rem;
		border-radius: 999px;
		font-size: 0.8rem;
	}

	.chip.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.chip.warn {
		background: #fff4e8;
		color: var(--warn);
	}

	.chip.muted {
		background: #eef3ff;
		color: #35558c;
	}

	.table-wrap {
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 980px;
	}

	th,
	td {
		padding: 0.65rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: top;
	}

	th {
		font-size: 0.79rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-soft);
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.empty {
		text-align: center;
		color: var(--text-soft);
	}

	.badge {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: lowercase;
	}

	.badge.success {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.warn {
		background: #fff4e8;
		color: var(--warn);
	}

	.badge.role {
		background: #eef3ff;
		color: #35558c;
	}

	.actions-col {
		display: grid;
		gap: 0.35rem;
	}

	.inline-form {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.lock {
		font-size: 0.84rem;
		color: var(--text-soft);
	}

	input,
	select {
		width: 100%;
		padding: 0.6rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		font: inherit;
	}

	button {
		font: inherit;
		padding: 0.46rem 0.68rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface-soft);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button.primary {
		border-color: var(--brand);
		background: var(--brand);
		color: #fff;
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

	@media (max-width: 980px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
