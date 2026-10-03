export const formatDateTime = (value: string | Date | null | undefined, fallback = 'Never') => {
	if (!value) return fallback;
	return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};
