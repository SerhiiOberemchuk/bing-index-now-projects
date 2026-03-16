import { buildKeyLocation, normalizeDomain } from '$lib/server/domain';

export type IndexNowKeyVerification =
	| { ok: true; keyLocation: string }
	| { ok: false; keyLocation: string; error: string };

function normalizeKeyValue(value: string): string {
	return value.trim().replace(/^\/+|\/+$/g, '');
}

export async function verifyIndexNowKey(domain: string, indexNowKey: string): Promise<IndexNowKeyVerification> {
	const host = normalizeDomain(domain);
	const normalizedKey = normalizeKeyValue(indexNowKey);
	const keyLocation = buildKeyLocation(host, normalizedKey);

	if (!host || !normalizedKey) {
		return {
			ok: false,
			keyLocation,
			error: 'Invalid domain or key.'
		};
	}

	let response: Response;
	try {
		response = await fetch(keyLocation, {
			headers: { 'User-Agent': 'IndexNow-Control-Center/1.0' },
			signal: AbortSignal.timeout(10000)
		});
	} catch {
		return {
			ok: false,
			keyLocation,
			error: `Could not fetch key file at ${keyLocation}.`
		};
	}

	if (!response.ok) {
		return {
			ok: false,
			keyLocation,
			error: `Key file is not accessible at ${keyLocation} (HTTP ${response.status}).`
		};
	}

	const fileContent = (await response.text()).trim();
	if (fileContent !== normalizedKey) {
		return {
			ok: false,
			keyLocation,
			error: `Key file content mismatch at ${keyLocation}. Expected '${normalizedKey}'.`
		};
	}

	return { ok: true, keyLocation };
}
