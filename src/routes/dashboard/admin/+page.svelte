<script lang="ts">
	let { data } = $props();
</script>

<section class="head">
	<h2>Admin</h2>
	<p>Owner-only operations and governance tools.</p>
</section>

<section class="stats">
	<article>
		<p>Pending approvals</p>
		<strong>{data.stats.pendingUsers}</strong>
	</article>
	<article>
		<p>Active invites</p>
		<strong>{data.stats.activeInvites}</strong>
	</article>
	<article>
		<p>Audit events</p>
		<strong>{data.stats.auditEvents}</strong>
	</article>
</section>

<section class="grid">
	<a class="card" href="/dashboard/settings">
		<h3>Team settings</h3>
		<p>Approve users and manage roles.</p>
	</a>
	<a class="card" href="/dashboard/invites">
		<h3>Invites</h3>
		<p>Create or revoke onboarding invites.</p>
	</a>
	<a class="card" href="/dashboard/audit">
		<h3>Audit log</h3>
		<p>Review security and admin actions.</p>
	</a>
</section>

<style>
	.head h2 { margin: 0; }
	.head p { margin: 0.35rem 0 0; color: var(--text-soft); }

	.stats {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.stats article {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.8rem;
	}

	.stats p { margin: 0; color: var(--text-soft); font-size: 0.84rem; }
	.stats strong { display: block; margin-top: 0.35rem; font-size: 1.2rem; }

	.grid {
		margin-top: 0.8rem;
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.card {
		display: block;
		text-decoration: none;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.9rem;
		color: inherit;
	}

	.card h3 { margin: 0; font-size: 1rem; }
	.card p { margin: 0.45rem 0 0; color: var(--text-soft); font-size: 0.9rem; }
</style>
