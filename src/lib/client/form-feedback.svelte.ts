import { enhance } from '$app/forms';
import { toast } from 'svelte-sonner';

type ManagedFormOptions = {
	id: string;
	label?: string;
	confirm?: {
		title: string;
		description?: string;
		actionLabel?: string;
		cancelLabel?: string;
	};
	successMessage?: string;
	errorMessage?: string;
};

let activeForms = $state<string[]>([]);

export const isFormBusy = (id: string) => activeForms.includes(id);

const startForm = (id: string) => {
	if (!activeForms.includes(id)) {
		activeForms = [...activeForms, id];
	}
};

const finishForm = (id: string) => {
	activeForms = activeForms.filter((item) => item !== id);
};

const textFromResult = (data: unknown, key: 'success' | 'error') => {
	if (!data || typeof data !== 'object') return null;
	const value = (data as Record<string, unknown>)[key];
	return typeof value === 'string' && value.length > 0 ? value : null;
};

export const confirmAction = (options: NonNullable<ManagedFormOptions['confirm']>) =>
	new Promise<boolean>((resolve) => {
		let settled = false;
		const settle = (value: boolean) => {
			if (settled) return;
			settled = true;
			resolve(value);
		};

		const id = toast(options.title, {
			description: options.description,
			duration: Number.POSITIVE_INFINITY,
			action: {
				label: options.actionLabel ?? 'Confirm',
				onClick: () => {
					toast.dismiss(id);
					settle(true);
				}
			},
			cancel: {
				label: options.cancelLabel ?? 'Cancel',
				onClick: () => {
					toast.dismiss(id);
					settle(false);
				}
			},
			onDismiss: () => settle(false),
			onAutoClose: () => settle(false)
		});
	});

export const managedForm = (node: HTMLFormElement, options: ManagedFormOptions) =>
	enhance(node, async ({ cancel }) => {
		if (isFormBusy(options.id)) {
			cancel();
			return;
		}

		if (options.confirm) {
			const confirmed = await confirmAction(options.confirm);
			if (!confirmed) {
				cancel();
				return;
			}
		}

		startForm(options.id);

		return async ({ result, update }) => {
			await update();
			finishForm(options.id);

			if (result.type === 'success') {
				toast.success(
					textFromResult(result.data, 'success') ?? options.successMessage ?? `${options.label ?? 'Action'} completed.`
				);
				return;
			}

			if (result.type === 'failure') {
				toast.error(
					textFromResult(result.data, 'error') ?? options.errorMessage ?? `${options.label ?? 'Action'} failed.`
				);
				return;
			}

			if (result.type === 'error') {
				toast.error(options.errorMessage ?? `${options.label ?? 'Action'} failed due to a server error.`);
			}
		};
	});
