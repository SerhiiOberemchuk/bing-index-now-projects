<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();
	const tokenValue = () => ((form?.inviteToken as string | undefined) ?? data.inviteToken ?? '').trim();
</script>

<svelte:head>
	<title>Sign up | IndexNow Control Center</title>
</svelte:head>

<main class="auth-wrap">
	<section class="card">
		<h1>Create account</h1>
		<p>Use your invite token to register. After email verification, account stays pending until owner approval.</p>

		<form method="POST" use:managedForm={{ id: 'signUp', label: 'Create account' }}>
			<label>
				Invite token
				<input type="text" name="inviteToken" value={tokenValue()} autocomplete="off" required disabled={isFormBusy('signUp')} />
			</label>

			<label>
				Name
				<input type="text" name="name" value={form?.name ?? ''} autocomplete="name" required disabled={isFormBusy('signUp')} />
			</label>

			<label>
				Email
				<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required disabled={isFormBusy('signUp')} />
			</label>

			<label>
				Password
				<input type="password" name="password" autocomplete="new-password" required disabled={isFormBusy('signUp')} />
			</label>

			<label>
				Confirm password
				<input type="password" name="confirmPassword" autocomplete="new-password" required disabled={isFormBusy('signUp')} />
			</label>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<button type="submit" disabled={isFormBusy('signUp')}>{isFormBusy('signUp') ? 'Creating...' : 'Create account'}</button>
		</form>

		<p class="helper">
			Already registered? <a href="/sign-in">Sign in</a>
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
		width: min(440px, 100%);
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
		margin-top: 0.9rem;
		font-size: 0.92rem;
	}
</style>
