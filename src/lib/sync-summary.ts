import { describeBingResponse } from '$lib/indexnow-response';

export type SyncResult = {
	source: 'manual' | 'cron';
	startedAt: string;
	finishedAt: string;
	sitemapsOk: number;
	sitemapErrors: string[];
	urlsInSitemap: number;
	/** Hosts whose URLs were skipped because they differ from the project domain. */
	skippedHosts: Record<string, number>;
	truncated: boolean;
	ignoredLastMod: number;
	removedUrls: number;
	newUrls: number;
	changedUrls: number;
	sentUrls: number;
	bing: { ok: boolean; statusCode: number | null; responseBody: string } | null;
	error: string | null;
};

export type SyncSummary = {
	tone: 'ok' | 'warn' | 'error';
	headline: string;
	notes: string[];
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

export function summarizeSync(result: SyncResult): SyncSummary {
	const notes: string[] = [];

	for (const [host, count] of Object.entries(result.skippedHosts ?? {})) {
		notes.push(
			`Skipped ${plural(count, 'URL')} on ${host}: the sitemap uses a different host than the project domain, and Bing only accepts URLs from the project domain.`
		);
	}
	for (const error of result.sitemapErrors ?? []) {
		notes.push(`Sitemap error: ${error}`);
	}
	if (result.ignoredLastMod > 0) {
		notes.push(
			`Ignored <lastmod> on ${plural(result.ignoredLastMod, 'page')}: the sitemap sets it to the current time, so it cannot tell which pages really changed. Only new pages will be sent.`
		);
	}
	if (result.removedUrls > 0) {
		notes.push(`${plural(result.removedUrls, 'page')} left the sitemap and were removed from the list.`);
	}
	if (result.truncated) {
		notes.push('The sitemap is larger than the read limit, so only part of it was checked.');
	}

	if (result.error) {
		return { tone: 'error', headline: result.error, notes };
	}

	const found = `Found ${plural(result.urlsInSitemap, 'page')} in the sitemap.`;
	const toSend = result.newUrls + result.changedUrls;

	if (result.urlsInSitemap === 0) {
		return { tone: 'error', headline: 'No pages found in the sitemap.', notes };
	}

	if (toSend === 0 || !result.bing) {
		return { tone: notes.length > 0 ? 'warn' : 'ok', headline: `${found} Nothing new to send.`, notes };
	}

	const breakdown = `${result.newUrls} new, ${result.changedUrls} changed`;
	const bing = describeBingResponse(result.bing.statusCode);
	if (result.bing.ok) {
		return {
			tone: notes.length > 0 ? 'warn' : 'ok',
			headline: `${found} Sent ${plural(result.sentUrls, 'page')} to Bing (${breakdown}): ${lowerFirst(bing.text)}.`,
			notes
		};
	}

	return {
		tone: 'error',
		headline: `${found} Bing rejected ${plural(toSend, 'page')} (${breakdown}): ${bing.text}. They will be retried on the next check.`,
		notes
	};
}
