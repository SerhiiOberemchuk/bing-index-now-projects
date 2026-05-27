<script lang="ts">
	import logo from '$lib/assets/logo.svg';

	let { data } = $props();
</script>

<svelte:head>
	<title>IndexNow Control Center</title>
</svelte:head>

<main class="wrap">
	<section class="hero">
		<div>
			<img class="logo" src={logo} alt="IndexNow Control Center" width="320" height="72" />
			<p class="eyebrow">Platform</p>
			<h1>IndexNow Control Center</h1>
			<p class="lead">Manage project indexing, sitemap discovery, and submission history from one place.</p>
		</div>
		{#if data.user}
			<a class="btn" href="/dashboard">Open dashboard</a>
		{:else}
			<div class="hero-actions">
				<a class="btn" href="/sign-in">Sign in</a>
				<a class="ghost" href="/sign-up">Create account</a>
			</div>
		{/if}
	</section>

	<section class="stats">
		<article class="card">
			<h2>Database</h2>
			<p>{data.dbReady ? 'Connected' : 'Not configured'}</p>
		</article>
		<article class="card">
			<h2>Projects</h2>
			<p>{data.projectCount}</p>
		</article>
		<article class="card">
			<h2>Session</h2>
			<p>{data.user ? 'Authenticated' : 'Guest'}</p>
		</article>
	</section>
</main>

<style>
	.wrap {
		max-width: 980px;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
		display: grid;
		gap: 1rem;
	}

	.hero {
		background: linear-gradient(125deg, #fdfefe 0%, #eaf3ff 100%);
		border: 1px solid var(--border);
		border-radius: 18px;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: end;
	}

	.hero-actions {
		display: flex;
		gap: 0.6rem;
	}

	.logo {
		display: block;
		width: min(320px, 100%);
		height: auto;
		margin-bottom: 0.9rem;
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.78rem;
		color: var(--text-soft);
	}

	h1 {
		margin: 0.35rem 0 0.5rem;
	}

	.lead {
		margin: 0;
		color: var(--text-soft);
	}

	.btn,
	.ghost {
		text-decoration: none;
		padding: 0.65rem 1rem;
		border-radius: 10px;
		font-weight: 600;
		white-space: nowrap;
	}

	.btn {
		background: var(--brand);
		color: #fff;
	}

	.ghost {
		border: 1px solid var(--border);
		background: var(--surface);
	}

	.stats {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1rem 1.1rem;
	}

	h2 {
		margin: 0 0 0.45rem;
		font-size: 0.95rem;
		color: var(--text-soft);
	}

	.card p {
		margin: 0;
		font-size: 1.45rem;
		font-weight: 700;
	}

	@media (max-width: 700px) {
		.hero {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
