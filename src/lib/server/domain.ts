export function normalizeDomain(input: string): string {
	let value = input.trim().toLowerCase();
	if (!value) return '';

	if (!/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
		value = `https://${value}`;
	}

	try {
		const url = new URL(value);
		return url.host.toLowerCase();
	} catch {
		return value
			.replace(/^https?:\/\//i, '')
			.split('/')[0]
			.replace(/\/+$/g, '')
			.toLowerCase();
	}
}

export function buildKeyLocation(domain: string, indexNowKey: string): string {
	const host = normalizeDomain(domain);
	const key = indexNowKey.trim().replace(/^\/+|\/+$/g, '');
	return `https://${host}/${key}.txt`;
}
