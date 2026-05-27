<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { data, form } = $props();
	const token = () => (form?.token as string | undefined) ?? data.token;
</script>

<svelte:head>
	<title>Reset password | IndexNow Control Center</title>
</svelte:head>

<main class="auth-wrap">
	<section class="card">
		<h1>Reset password</h1>
		<p>Set a new password for your account.</p>

		{#if !token()}
			<p class="error">Reset token is missing. Open the link from your email again.</p>
		{:else}
			<form method="POST" use:managedForm={{ id: 'resetPassword', label: 'Reset password' }}>
				<input type="hidden" name="token" value={token()} />
				<label>
					New password
					<input type="password" name="password" autocomplete="new-password" required disabled={isFormBusy('resetPassword')} />
				</label>

				<label>
					Confirm password
					<input type="password" name="confirmPassword" autocomplete="new-password" required disabled={isFormBusy('resetPassword')} />
				</label>

				{#if form?.error}
					<p class="error">{form.error}</p>
				{/if}

				<button type="submit" disabled={isFormBusy('resetPassword')}>
					{isFormBusy('resetPassword') ? 'Resetting...' : 'Reset password'}
				</button>
			</form>
		{/if}

		<p class="helper"><a href="/sign-in">Back to sign in</a></p>
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
