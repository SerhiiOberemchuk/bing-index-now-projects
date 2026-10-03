import { describeBingResponse } from '$lib/indexnow-response';

export type ProjectStats = {
	/** Pages currently listed in the site's sitemap. */
	inSitemap: number;
	/** Pages Bing has accepted at least once. */
	sent: number;
	/** New pages, or pages whose <lastmod> changed after they were last sent. */
	waiting: number;
	sitemapErrors: number;
	lastSubmission: { createdAt: Date; ok: boolean; statusCode: number | null; urlCount: number } | null;
};

export type ProjectStatus = { tone: 'ok' | 'warn' | 'error' | 'muted'; text: string };

/** One plain-language line that says whether the site needs attention. */
export function projectStatus(
	project: { status: string; schedule: string; lastAutomationRunAt: Date | null },
	stats: ProjectStats
): ProjectStatus {
	if (project.status === 'paused') {
		return { tone: 'muted', text: 'Paused: nothing is sent to Bing' };
	}
	if (stats.lastSubmission && !stats.lastSubmission.ok) {
		return {
			tone: 'error',
			text: `Last send failed: ${describeBingResponse(stats.lastSubmission.statusCode).text}`
		};
	}
	if (stats.sitemapErrors > 0) {
		return { tone: 'error', text: 'Sitemap could not be read' };
	}
	if (!project.lastAutomationRunAt && stats.inSitemap === 0) {
		return { tone: 'warn', text: 'Not checked yet: open the site and run a check' };
	}
	if (stats.inSitemap === 0) {
		return { tone: 'error', text: 'No pages found in the sitemap' };
	}
	if (project.schedule === 'disabled') {
		return {
			tone: 'warn',
			text: 'Auto-check is off: new pages are sent only when you run a check'
		};
	}
	if (stats.waiting > 0) {
		return { tone: 'warn', text: `${stats.waiting} pages will be sent on the next check` };
	}
	return { tone: 'ok', text: 'Up to date: Bing has received every page' };
}
