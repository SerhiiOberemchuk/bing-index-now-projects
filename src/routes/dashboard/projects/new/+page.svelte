<script lang="ts">
	let { form, data } = $props();

	const formValue = (key: string) =>
		((form as Record<string, unknown> | undefined)?.values as Record<string, string> | undefined)?.[key] ?? '';

	const scheduleValue = () => formValue('schedule') || 'disabled';

	const scheduleLabel = (value: string) => {
		switch (value) {
			case 'every_6h':
				return 'Every 6 hours';
			case 'daily':
				return 'Daily';
			case 'weekly':
				return 'Weekly';
			default:
				return 'Disabled';
		}
	};
</script>

<section class="box">
	<h2>Create project</h2>
	<p>Create a real project record in Neon database.</p>

	<form method="POST">
		<label for="name">Project name</label>
		<input id="name" name="name" type="text" placeholder="Acme Europe" value={formValue('name')} />

		<label for="domain">Primary domain</label>
		<input id="domain" name="domain" type="text" placeholder="acme.com" value={formValue('domain')} />

		<label for="indexNowKey">IndexNow key</label>
		<input
			id="indexNowKey"
			name="indexNowKey"
			type="text"
			placeholder="your-indexnow-key"
			value={formValue('indexNowKey')}
		/>

		<label for="schedule">Automation schedule</label>
		<select id="schedule" name="schedule" value={scheduleValue()}>
			{#each data.scheduleOptions as option}
				<option value={option}>{scheduleLabel(option)}</option>
			{/each}
		</select>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<div class="actions">
			<button type="submit" class="primary">Save project</button>
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
		margin: 0;
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
