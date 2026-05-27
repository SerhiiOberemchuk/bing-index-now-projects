<script lang="ts">
	import { isFormBusy, managedForm } from '$lib/client/form-feedback.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Forgot password | IndexNow Control Center</title>
</svelte:head>

<main class="auth-wrap">
	<section class="card">
		<h1>Forgot password</h1>
		<p>Enter your email and we will send a password reset link.</p>

		<form method="POST" use:managedForm={{ id: 'forgotPassword', label: 'Send reset link' }}>
			<label>
				Email
				<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required disabled={isFormBusy('forgotPassword')} />
			</label>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="success">{form.success}</p>
			{/if}

			<button type="submit" disabled={isFormBusy('forgotPassword')}>
				{isFormBusy('forgotPassword') ? 'Sending...' : 'Send reset link'}
			</button>
		</form>

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
	.success {
		margin: 0;
		color: var(--ok);
	}
	.helper {
		margin-top: 0.9rem;
		font-size: 0.92rem;
	}
</style>
