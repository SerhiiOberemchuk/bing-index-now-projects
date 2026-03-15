<script lang="ts">
	let { data } = $props();

	const formatDateTime = (value: string | Date | null, fallback = 'No submissions yet') => {
		if (!value) return fallback;
		return new Date(value).toLocaleString();
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
</script>

<section class="header-row">
	<div>
		<h2>Projects</h2>
		<p>Connected to database. {data.projects.length} total projects.</p>
	</div>
	{#if data.canManage}
		<a href="/dashboard/projects/new" class="btn">+ New project</a>
	{:else}
		<span class="btn disabled">+ New project</span>
	{/if}
</section>

{#if !data.canManage}
	<p class="readonly-note">You have read-only access. Creating or changing projects is disabled for your role.</p>
{/if}

<section class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Domain</th>
				<th>Status</th>
				<th>Health</th>
				<th>Pending</th>
				<th>Last error</th>
				<th>Schedule</th>
				<th>Next run</th>
				<th>Last submission</th>
				<th>Success rate</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#if data.projects.length === 0}
				<tr>
					<td colspan="11" class="empty">No projects yet. Create your first project.</td>
				</tr>
			{:else}
				{#each data.projects as row}
					<tr>
						<td>{row.name}</td>
						<td>{row.domain}</td>
						<td>
							<span class:paused={row.status === 'paused'} class="badge">{row.status}</span>
						</td>
						<td>
							<span class="health {row.healthStatus}">{healthLabel(row.healthStatus)}</span>
						</td>
						<td>{row.pendingIndexing}</td>
						<td>
							{#if row.lastFailureCode}
								HTTP {row.lastFailureCode} ({formatDateTime(row.lastFailureAt, 'N/A')})
							{:else}
								-
							{/if}
						</td>
						<td>{scheduleLabel(row.schedule)}</td>
						<td>{formatDateTime(row.nextRunAt, 'Not scheduled')}</td>
						<td>{formatDateTime(row.lastSubmissionAt)}</td>
						<td>{row.successRate === null ? 'N/A' : `${row.successRate}%`}</td>
						<td><a href={`/dashboard/projects/${row.id}`}>Open</a></td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</section>

<style>
	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 0.7rem;
	}

	h2 {
		margin: 0;
	}

	p {
		margin: 0.35rem 0 0;
		color: var(--text-soft);
	}

	.btn {
		text-decoration: none;
		background: var(--brand);
		color: #fff;
		padding: 0.58rem 0.85rem;
		border-radius: 9px;
		font-weight: 600;
		white-space: nowrap;
	}

	.btn.disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.readonly-note {
		margin: 0.7rem 0 0;
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

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 1300px;
	}

	th,
	td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	th {
		font-size: 0.8rem;
		color: var(--text-soft);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.empty {
		text-align: center;
		color: var(--text-soft);
	}

	.badge,
	.health {
		display: inline-block;
		padding: 0.18rem 0.45rem;
		border-radius: 999px;
		font-size: 0.78rem;
		text-transform: capitalize;
	}

	.badge {
		background: #e8f8ef;
		color: var(--ok);
	}

	.badge.paused {
		background: #fff4e8;
		color: var(--warn);
	}

	.health.healthy {
		background: #e8f8ef;
		color: var(--ok);
	}

	.health.warning {
		background: #fff4e8;
		color: var(--warn);
	}

	.health.paused,
	.health.setup_required {
		background: #ffe8e8;
		color: var(--danger);
	}

	.health.active {
		background: #eef3ff;
		color: #35558c;
	}
</style>
