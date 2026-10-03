<script lang="ts">
	import { isFormBusy, managedForm } from '#lib/client/form-feedback.svelte.js';
	import { DEFAULT_PROJECT_SCHEDULE, scheduleLabel } from '#lib/schedule.js';

	let { form, data } = $props();

	const formValue = (key: string) =>
		((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';

	const scheduleValue = () => formValue('schedule') || DEFAULT_PROJECT_SCHEDULE;

	let domainInput = $state('');
	let keyInput = $state('');
	$effect.pre(() => {
		domainInput = formValue('domain');
		keyInput = formValue('indexNowKey');
	});

	const keyFileUrl = $derived(
		`https://${domainInput.trim().replace(/^https?:\/\//, '').split('/')[0] || 'your-site.com'}/${keyInput.trim() || '<key>'}.txt`
	);
</script>

<section class="box">
	<a href="/dashboard/projects" class="back">← All sites</a>
	<h2>Add site</h2>

	<ol class="steps">
		<li>
			Get an IndexNow key: any 8–128 characters of letters, digits and dashes, or generate one in
			<a href="https://www.bing.com/indexnow/getstarted" target="_blank" rel="noreferrer">Bing's IndexNow guide</a>.
		</li>
		<li>Put a text file on the site at <code>{keyFileUrl}</code> that contains only the key.</li>
		<li>Fill in the form. The app checks the key file before saving.</li>
	</ol>

	<form method="POST" use:managedForm={{ id: 'createProject', label: 'Add site' }}>
		<label for="name">Name</label>
		<input id="name" name="name" type="text" placeholder="My shop" value={formValue('name')} disabled={isFormBusy('createProject')} />

		<label for="domain">Domain, exactly as in the sitemap (with or without www)</label>
		<input id="domain" name="domain" type="text" placeholder="example.com" bind:value={domainInput} disabled={isFormBusy('createProject')} />

		<label for="indexNowKey">IndexNow key</label>
		<input
			id="indexNowKey"
			name="indexNowKey"
			type="text"
			placeholder="a1b2c3d4e5f6..."
			bind:value={keyInput}
			disabled={isFormBusy('createProject')}
		/>

		<label for="schedule">Auto-check the sitemap</label>
		<select id="schedule" name="schedule" value={scheduleValue()} disabled={isFormBusy('createProject')}>
			{#each data.scheduleOptions as option}
				<option value={option}>{scheduleLabel(option)}</option>
			{/each}
		</select>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<div class="actions">
			<button type="submit" class="primary" disabled={isFormBusy('createProject')}>
				{isFormBusy('createProject') ? 'Checking key file…' : 'Add site'}
			</button>
			<a href="/dashboard/projects">Cancel</a>
		</div>
	</form>
</section>

<style>
	.box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 1rem;
		max-width: 760px;
	}

	h2 {
		margin: 0.35rem 0 0;
	}

	.back {
		color: var(--text-soft);
		text-decoration: none;
		font-size: 0.9rem;
	}

	.steps {
		margin: 0.8rem 0 1rem;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.35rem;
		color: var(--text-soft);
		font-size: 0.92rem;
		overflow-wrap: anywhere;
	}

	p {
		margin: 0.35rem 0 1rem;
		color: var(--text-soft);
	}

	form {
		display: grid;
		gap: 0.5rem;
	}

	label {
		display: grid;
		font-size: 0.9rem;
	}

	input,
	select {
		width: 100%;
		padding: 0.62rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		font: inherit;
		background: #fff;
		margin-bottom: 0.35rem;
	}

	.error {
		margin: 0.2rem 0;
		color: var(--danger);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	button,
	.actions a {
		font: inherit;
		text-decoration: none;
		padding: 0.56rem 0.8rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		cursor: pointer;
	}

	button.primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
</style>
