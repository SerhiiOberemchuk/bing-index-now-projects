<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';
</script>

<svelte:head>
	<title>Pending Approval | IndexNow Control Center</title>
</svelte:head>

<main class="wrap">
	<section class="card">
		<h1>Account pending approval</h1>
		<p>Your email is verified, but access is blocked until the owner approves your account.</p>
		<p class="muted">Once approved, refresh the page or sign in again.</p>

		<div class="actions">
			<a href="/sign-in" class="ghost">Back to sign in</a>
			<form method="POST" action="/sign-out" use:managedForm={{ id: 'pendingSignOut', label: 'Sign out' }}>
				<button type="submit" class="danger" disabled={isFormBusy('pendingSignOut')}>
					{isFormBusy('pendingSignOut') ? 'Signing out...' : 'Sign out'}
				</button>
			</form>
		</div>
	</section>
</main>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.card {
		width: min(520px, 100%);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.25rem;
	}

	h1 {
		margin: 0;
	}

	p {
		margin: 0.45rem 0 0;
		color: var(--text-soft);
	}

	.muted {
		font-size: 0.9rem;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		gap: 0.55rem;
		align-items: center;
	}

	.ghost,
	.danger {
		text-decoration: none;
		padding: 0.52rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface-soft);
		font: inherit;
		cursor: pointer;
	}

	.danger {
		background: #fff1f0;
		border-color: #fac5bf;
		color: #9f2418;
	}
</style>
