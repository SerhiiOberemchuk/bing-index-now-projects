import { normalizeDomain } from '$lib/server/domain';

const USER_AGENT = 'IndexNow-Control-Center/1.0';
const FETCH_TIMEOUT_MS = 15_000;

export type ParsedUrl = {
	url: string;
	lastMod: Date | null;
	sourceSitemap: string;
};

export type CrawledSitemap = {
	url: string;
	ok: boolean;
	error: string | null;
};

export type SitemapCrawlResult = {
	sitemaps: CrawledSitemap[];
	urls: ParsedUrl[];
	/** URLs dropped because their host differs from the project domain (e.g. www vs non-www). */
	skippedHosts: Record<string, number>;
	/** True when maxSitemaps/maxUrls was reached, so the URL list is incomplete. */
	truncated: boolean;
};

// Matches <tag ...>...</tag> but not longer names sharing the prefix (<url> but not <urlset>).
const tagRegex = (tag: string) => new RegExp(`<${tag}(?![\\w:-])[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');

function decodeXml(text: string): string {
	return text
		.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;|&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.trim();
}

function getTagValues(xml: string, tag: string): string[] {
	return Array.from(xml.matchAll(tagRegex(tag)), (match) => decodeXml(match[1]));
}

function parseDateOrNull(value: string | undefined): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; bodyText: string }> {
	const response = await fetch(url, {
		headers: { 'User-Agent': USER_AGENT },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
	});
	const buffer = await response.arrayBuffer();
	const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
	// Some sites serve .xml.gz without Content-Encoding, so fetch does not unpack it.
	const isGzip = head[0] === 0x1f && head[1] === 0x8b;
	const bodyText = isGzip
		? await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
		: new TextDecoder().decode(buffer);
	return { ok: response.ok, status: response.status, bodyText };
}

/** Sitemaps listed in robots.txt, or /sitemap.xml when robots.txt lists none. */
export async function discoverSitemapRoots(projectDomain: string): Promise<string[]> {
	const base = `https://${normalizeDomain(projectDomain)}`;
	const roots = new Set<string>();

	try {
		const robots = await fetchText(`${base}/robots.txt`);
		if (robots.ok) {
			for (const line of robots.bodyText.split(/\r?\n/)) {
				const match = line.trim().match(/^sitemap:\s*(\S+)/i);
				if (!match) continue;
				try {
					roots.add(new URL(match[1], base).toString());
				} catch {
					// Ignore malformed sitemap lines in robots.txt
				}
			}
		}
	} catch {
		// robots.txt is optional
	}

	if (roots.size === 0) roots.add(`${base}/sitemap.xml`);
	return Array.from(roots);
}

export async function crawlSitemaps(options: {
	projectDomain: string;
	maxSitemaps?: number;
	maxUrls?: number;
}): Promise<SitemapCrawlResult> {
	const maxSitemaps = options.maxSitemaps ?? 30;
	const maxUrls = options.maxUrls ?? 20_000;
	const expectedHost = normalizeDomain(options.projectDomain);

	const queue = await discoverSitemapRoots(options.projectDomain);
	const visited = new Set<string>();
	const sitemaps: CrawledSitemap[] = [];
	const urls = new Map<string, ParsedUrl>();
	const skippedHosts: Record<string, number> = {};
	let truncated = false;

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (visited.has(current)) continue;
		if (visited.size >= maxSitemaps || urls.size >= maxUrls) {
			truncated = true;
			break;
		}
		visited.add(current);

		let xml: string;
		try {
			const response = await fetchText(current);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			xml = response.bodyText;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Fetch failed';
			sitemaps.push({ url: current, ok: false, error: message });
			continue;
		}

		const childSitemaps = getTagValues(xml, 'sitemap').flatMap((node) => getTagValues(node, 'loc'));
		const urlNodes = getTagValues(xml, 'url');

		if (childSitemaps.length === 0 && urlNodes.length === 0) {
			sitemaps.push({ url: current, ok: false, error: 'Not a sitemap: no <url> or <sitemap> entries found' });
			continue;
		}
		sitemaps.push({ url: current, ok: true, error: null });

		for (const loc of childSitemaps) {
			try {
				queue.push(new URL(loc, current).toString());
			} catch {
				// Ignore malformed child sitemap URL
			}
		}

		for (const node of urlNodes) {
			if (urls.size >= maxUrls) {
				truncated = true;
				break;
			}

			const loc = getTagValues(node, 'loc')[0];
			if (!loc) continue;

			let absolute: URL;
			try {
				absolute = new URL(loc, current);
			} catch {
				continue;
			}

			const host = normalizeDomain(absolute.host);
			if (host !== expectedHost) {
				skippedHosts[host] = (skippedHosts[host] ?? 0) + 1;
				continue;
			}

			const url = absolute.toString();
			urls.set(url, {
				url,
				lastMod: parseDateOrNull(getTagValues(node, 'lastmod')[0]),
				sourceSitemap: current
			});
		}
	}

	return {
		sitemaps,
		urls: Array.from(urls.values()),
		skippedHosts,
		truncated
	};
}
