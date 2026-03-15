<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>IndexNow Control Center</title>
</svelte:head>

<main>
	<section class="card">
		<h1>IndexNow Control Center</h1>
		<p>Base scaffold for client project management and Bing IndexNow URL submission.</p>
	</section>

	<section class="grid">
		<article class="card">
			<h2>Connection status</h2>
			<p>{data.dbReady ? 'Database connected' : 'Database is not configured yet (check DATABASE_URL)'}</p>
		</article>

		<article class="card">
			<h2>Total projects</h2>
			<p>{data.projectCount}</p>
		</article>
	</section>

	<section class="card">
		<h2>API (MVP)</h2>
		<ul>
			<li><code>GET /api/health</code> - server and database health check</li>
			<li><code>GET /api/projects</code> - list projects</li>
			<li><code>POST /api/projects</code> - create project</li>
			<li><code>POST /api/indexnow/submit</code> - submit URL list to Bing IndexNow</li>
		</ul>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: linear-gradient(140deg, #f5f7ff 0%, #edf2ff 100%);
		color: #0f172a;
	}

	main {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1rem 4rem;
		display: grid;
		gap: 1rem;
	}

	.grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
	}

	h1,
	h2 {
		margin: 0 0 0.75rem;
	}

	p,
	li {
		line-height: 1.5;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
	}
</style>
