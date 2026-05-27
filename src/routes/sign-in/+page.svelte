<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Sign in | IndexNow Control Center</title>
</svelte:head>

<main class="auth-wrap">
	<section class="card">
		<h1>Sign in</h1>
		<p>Sign in with your account to access the dashboard.</p>

		{#if data.showVerificationNotice}
			<p class="notice">Check your inbox (and spam) for the verification email, then sign in.</p>
		{/if}
		{#if data.showResetNotice}
			<p class="notice success">Password was reset successfully. You can sign in now.</p>
		{/if}

		<form method="POST" use:managedForm={{ id: 'signIn', label: 'Sign in' }}>
			<label>
				Email
				<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required disabled={isFormBusy('signIn')} />
			</label>

			<label>
				Password
				<input type="password" name="password" autocomplete="current-password" required disabled={isFormBusy('signIn')} />
			</label>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<button type="submit" disabled={isFormBusy('signIn')}>{isFormBusy('signIn') ? 'Signing in...' : 'Sign in'}</button>
		</form>

		<p class="helper">
			Forgot password? <a href="/forgot-password">Reset it</a>
		</p>
		<p class="helper">
			No account yet? <a href="/sign-up">Create account</a>
		</p>
	</section>
</main>

<style>
	.auth-wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1rem;
	}

	.card {
		width: min(420px, 100%);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1.25rem;
	}

	h1 {
		margin: 0;
	}

	p {
		margin: 0.35rem 0 1rem;
		color: var(--text-soft);
	}

	.notice {
		margin: 0 0 0.8rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid #facc15;
		background: #fff8db;
		border-radius: 8px;
		color: #7a5800;
	}

	.notice.success {
		border-color: #86efac;
		background: #ecfdf3;
		color: #166534;
	}

	form {
		display: grid;
		gap: 0.8rem;
	}

	label {
		display: grid;
		gap: 0.3rem;
		font-size: 0.92rem;
	}

	input {
		padding: 0.58rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		font: inherit;
	}

	button {
		margin-top: 0.3rem;
		border: 0;
		border-radius: 9px;
		padding: 0.62rem 0.8rem;
		background: var(--brand);
		color: #fff;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.error {
		margin: 0;
		color: var(--danger);
	}

	.helper {
		margin-top: 0.7rem;
		font-size: 0.92rem;
	}
</style>
