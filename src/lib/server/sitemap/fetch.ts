import { normalizeDomain } from '$lib/server/domain';

type ParsedUrl = {
	url: string;
	lastMod: Date | null;
	sourceSitemap: string;
};

export type SitemapFetchResult = {
	rootSitemap: string;
	visitedSitemaps: string[];
	urls: ParsedUrl[];
};

const XML_TAG_RE = (tag: string) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');

function decodeXml(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();
}

function getTagValues(xml: string, tag: string): string[] {
	const regex = XML_TAG_RE(tag);
	const result: string[] = [];
	let match: RegExpExecArray | null = null;
	while ((match = regex.exec(xml)) !== null) {
		result.push(decodeXml(match[1]));
	}
	return result;
}

function parseDateOrNull(value: string | undefined): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function toAbsoluteUrl(value: string, base: string): string {
	return new URL(value, base).toString();
}

export async function discoverSitemapCandidates(projectDomain: string): Promise<string[]> {
	const host = normalizeDomain(projectDomain);
	const base = `https://${host}`;
	const defaultSitemap = `${base}/sitemap.xml`;
	const candidates = new Set<string>([defaultSitemap]);

	try {
		const robotsResponse = await fetch(`${base}/robots.txt`, {
			headers: { 'User-Agent': 'IndexNow-Control-Center/1.0' }
		});
		if (robotsResponse.ok) {
			const robotsText = await robotsResponse.text();
			for (const line of robotsText.split(/\r?\n/)) {
				const trimmed = line.trim();
				if (!trimmed.toLowerCase().startsWith('sitemap:')) continue;
				const raw = trimmed.slice(8).trim();
				if (!raw) continue;
				try {
					candidates.add(toAbsoluteUrl(raw, base));
				} catch {
					// Ignore malformed sitemap lines in robots.txt
				}
			}
		}
	} catch {
		// Fallback to default sitemap only
	}

	return Array.from(candidates);
}

export async function fetchSitemapUrls(options: {
	projectDomain: string;
	sitemapUrl: string;
	maxSitemaps?: number;
	maxUrls?: number;
}): Promise<SitemapFetchResult> {
	const maxSitemaps = options.maxSitemaps ?? 25;
	const maxUrls = options.maxUrls ?? 20000;
	const expectedHost = normalizeDomain(options.projectDomain);
	const rootSitemap = toAbsoluteUrl(options.sitemapUrl, `https://${expectedHost}/`);

	const queue = [rootSitemap];
	const visited = new Set<string>();
	const urls = new Map<string, ParsedUrl>();

	while (queue.length > 0 && visited.size < maxSitemaps && urls.size < maxUrls) {
		const current = queue.shift();
		if (!current || visited.has(current)) continue;
		visited.add(current);

		const response = await fetch(current, {
			headers: {
				'User-Agent': 'IndexNow-Control-Center/1.0'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch sitemap ${current}. HTTP ${response.status}`);
		}

		const xml = await response.text();
		const sitemapLocs = getTagValues(xml, 'sitemap').flatMap((node) => getTagValues(node, 'loc'));

		if (sitemapLocs.length > 0) {
			for (const loc of sitemapLocs) {
				if (queue.length + visited.size >= maxSitemaps) break;
				const next = toAbsoluteUrl(loc, current);
				if (!visited.has(next)) queue.push(next);
			}
			continue;
		}

		const urlNodes = getTagValues(xml, 'url');
		for (const node of urlNodes) {
			if (urls.size >= maxUrls) break;

			const loc = getTagValues(node, 'loc')[0];
			if (!loc) continue;
			const absolute = toAbsoluteUrl(loc, current);
			const parsed = new URL(absolute);
			if (normalizeDomain(parsed.host) !== expectedHost) continue;

			const lastMod = parseDateOrNull(getTagValues(node, 'lastmod')[0]);
			urls.set(absolute, {
				url: absolute,
				lastMod,
				sourceSitemap: current
			});
		}
	}

	return {
		rootSitemap,
		visitedSitemaps: Array.from(visited),
		urls: Array.from(urls.values())
	};
}
