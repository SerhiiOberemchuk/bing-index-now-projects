<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	const nav = () => [
		{ href: '/dashboard', label: 'Overview' },
		{ href: '/dashboard/projects', label: 'Projects' },
		{
			href: '/dashboard/alerts',
			label: 'Alerts',
			badge: data.canManage && data.alertsCount > 0 ? String(data.alertsCount) : null
		},
		{ href: '/dashboard/settings', label: 'Settings' },
		...(data.user?.role === 'owner'
			? [
				{
					href: '/dashboard/admin',
					label: 'Admin',
					badge: data.pendingApprovals > 0 ? String(data.pendingApprovals) : null
				}
			]
			: [])
	];

	const isActive = (href: string) =>
		href === '/dashboard' ? page.url.pathname === href : page.url.pathname.startsWith(href);
</script>

<div class="app-shell">
	<aside class="sidebar">
		<div class="brand">
			<p class="brand-top">IndexNow</p>
			<p class="brand-bottom">Control Center</p>
		</div>

		<nav>
			{#each nav() as item}
				<a class:active={isActive(item.href)} href={item.href}>
					<span>{item.label}</span>
					{#if item.badge}
						<span class="nav-badge">{item.badge}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="meta">
			<p>Signed in as</p>
			<strong>{data.user?.email ?? 'Unknown user'}</strong>
			<p class="role">Role: {data.user?.role ?? 'viewer'}</p>
			{#if !data.canManage}
				<p class="readonly">Read-only access</p>
			{/if}
		</div>
	</aside>

	<div class="content">
		<header class="topbar">
			<div>
				<p class="eyebrow">Client platform</p>
				<h1>Dashboard</h1>
			</div>
			<div class="top-actions">
				<a href="/" class="ghost">Landing</a>
				<form method="POST" action="/sign-out">
					<button class="danger" type="submit">Sign out</button>
				</form>
			</div>
		</header>

		<main>{@render children()}</main>
	</div>
</div>

<style>
	:global(html, body) {
		overflow-x: hidden;
	}

	.app-shell {
		height: 100dvh;
		display: grid;
		grid-template-columns: 260px 1fr;
		overflow: hidden;
	}

	.sidebar {
		background: #0f2343;
		color: #d6e1f6;
		padding: 1.25rem 1rem;
		display: grid;
		gap: 1.5rem;
		align-content: start;
		position: sticky;
		top: 0;
		height: 100dvh;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.brand {
		padding: 0.25rem 0.5rem;
	}

	.brand-top {
		margin: 0;
		font-size: 0.74rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8fb0e1;
	}

	.brand-bottom {
		margin: 0.2rem 0 0;
		font-size: 1.12rem;
		font-weight: 700;
	}

	nav {
		display: grid;
		gap: 0.35rem;
	}

	nav a {
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	nav a.active {
		background: #123362;
		color: #ffffff;
	}

	.nav-badge {
		display: inline-block;
		min-width: 1.2rem;
		padding: 0.1rem 0.35rem;
		text-align: center;
		border-radius: 999px;
		font-size: 0.76rem;
		background: #fff4e8;
		color: #c65f00;
	}

	.meta {
		margin-top: auto;
		padding: 0.75rem;
		border-radius: 10px;
		background: #123362;
		font-size: 0.86rem;
	}

	.meta p {
		margin: 0 0 0.2rem;
		color: #9ab6de;
	}

	.meta .role {
		margin-top: 0.45rem;
	}

	.meta .readonly {
		display: inline-block;
		margin-top: 0.35rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: #fff4e8;
		color: #c65f00;
	}

	.content {
		padding: 1rem;
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 1rem;
		min-width: 0;
		height: 100dvh;
		overflow: hidden;
	}

	.topbar {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 0.9rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.top-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.top-actions form {
		margin: 0;
	}

	main {
		min-width: 0;
		overflow: auto;
		overscroll-behavior: contain;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-soft);
	}

	.topbar h1 {
		margin: 0.2rem 0 0;
		font-size: 1.15rem;
	}

	.ghost,
	.danger {
		text-decoration: none;
		padding: 0.5rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface-soft);
		font: inherit;
		cursor: pointer;
		transition: filter 0.15s ease;
	}

	.ghost:hover,
	.danger:hover {
		filter: brightness(0.96);
	}

	.danger {
		background: #fff1f0;
		border-color: #fac5bf;
		color: #9f2418;
	}

	@media (max-width: 920px) {
		.app-shell {
			grid-template-columns: 1fr;
			height: auto;
			overflow: visible;
		}

		.sidebar {
			gap: 1rem;
			position: static;
			top: auto;
			height: auto;
			max-height: 42dvh;
			overflow-y: auto;
		}

		.meta {
			margin-top: 0;
		}

		.content {
			height: auto;
			overflow: visible;
		}

		main {
			overflow: visible;
		}

		.topbar {
			flex-wrap: wrap;
			gap: 0.6rem;
		}
	}
</style>
