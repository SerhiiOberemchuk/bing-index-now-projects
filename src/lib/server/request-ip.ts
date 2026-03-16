export function getRequestIp(request: Request, getClientAddress?: (() => string) | undefined): string {
	try {
		if (getClientAddress) {
			const value = getClientAddress();
			if (value) return value;
		}
	} catch {
		// Ignore adapter-level IP errors and fallback to headers.
	}

	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}

	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;

	return 'unknown';
}
