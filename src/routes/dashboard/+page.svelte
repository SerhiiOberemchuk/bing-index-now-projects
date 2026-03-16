<script lang="ts">
	let { data } = $props();

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return 'No activity';
		return new Date(value).toLocaleString();
	};
</script>

<section class="stats-grid">
	<article class="card tone-blue">
		<p class="label">Projects</p>
		<p class="value">{data.stats.totalProjects}</p>
		<p class="sub">{data.stats.activeProjects} active, {data.stats.pausedProjects} paused</p>
	</article>
	<article class="card tone-green">
		<p class="label">Today submissions</p>
		<p class="value">{data.stats.todaySubmissions}</p>
		<p class="sub">{data.stats.todaySuccessRate}% success rate</p>
	</article>
	<article class="card tone-orange">
		<p class="label">Recent events</p>
		<p class="value">{data.recentSubmissions.length}</p>
		<p class="sub">Latest records shown below</p>
	</article>
	<article class="card tone-red">
		<p class="label">Failed in recent list</p>
		<p class="value">{data.recentSubmissions.filter((row) => row.status === 'failed').length}</p>
		<p class="sub">Immediate review recommended</p>
	</article>
</section>

<section class="panel-grid">
	<article class="panel">
		<header>
			<h2>Recent project activity</h2>
		</header>
		{#if data.recentSubmissions.length === 0}
			<p class="empty">No submissions yet. Start by creating a project.</p>
		{:else}
			<ul>
				{#each data.recentSubmissions as row}
					<li>
						<strong>{row.projectDomain}</strong>
						<span>{row.urlCount} URLs - {row.status} - {formatDateTime(row.createdAt)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</article>

	<article class="panel">
		<header>
			<h2>Quick actions</h2>
		</header>
		<div class="actions">
			{#if data.canManage}
				<a href="/dashboard/projects/new">Create project</a>
			{:else}
				<span class="disabled">Create project</span>
			{/if}
			<a href="/dashboard/alerts">Review alerts</a>
			<a href="/dashboard/settings">Team settings</a>`r`n`t`t`t<a href="/dashboard/security">Session security</a>
		</div>
	</article>
</section>

<style>
	.stats-grid {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 0.9rem;
	}

	.label {
		margin: 0;
		font-size: 0.82rem;
		color: var(--text-soft);
	}

	.value {
		margin: 0.35rem 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.sub {
		margin: 0;
		font-size: 0.88rem;
		color: var(--text-soft);
	}

	.tone-blue {
		border-left: 5px solid #0a6ed1;
	}
	.tone-green {
		border-left: 5px solid #117a4f;
	}
	.tone-orange {
		border-left: 5px solid #c65f00;
	}
	.tone-red {
		border-left: 5px solid #b42318;
	}

	.panel-grid {
		display: grid;
		gap: 0.9rem;
		margin-top: 0.9rem;
		grid-template-columns: 2fr 1fr;
	}

	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
	}

	.empty {
		margin: 0.8rem 0 0;
		color: var(--text-soft);
	}

	ul {
		margin: 0.8rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.55rem;
	}

	li {
		color: var(--text-soft);
	}

	li strong {
		display: block;
		color: var(--text);
	}

	.actions {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.55rem;
	}

	.actions a,
	.actions .disabled {
		text-decoration: none;
		padding: 0.55rem 0.7rem;
		background: var(--surface-soft);
		border: 1px solid var(--border);
		border-radius: 9px;
	}

	.actions .disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	@media (max-width: 980px) {
		.panel-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

