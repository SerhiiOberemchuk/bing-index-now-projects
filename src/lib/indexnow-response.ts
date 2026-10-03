// Meaning of Bing IndexNow HTTP responses, see https://www.indexnow.org/documentation#response
// A 200/202 only means Bing received the URLs. It does not mean the pages are indexed:
// Bing decides when to crawl them, and the real index status is visible only in Bing Webmaster Tools.

export type BingResponseTone = 'ok' | 'error';

export function describeBingResponse(statusCode: number | null): { tone: BingResponseTone; text: string } {
	switch (statusCode) {
		case 200:
			return { tone: 'ok', text: 'Received by Bing' };
		case 202:
			return { tone: 'ok', text: 'Received by Bing, key check still pending' };
		case 400:
			return { tone: 'error', text: 'Bad request: invalid format' };
		case 403:
			return { tone: 'error', text: 'Key not valid: key file missing or its content does not match' };
		case 422:
			return { tone: 'error', text: 'URLs do not belong to this domain, or the key format is invalid' };
		case 429:
			return { tone: 'error', text: 'Too many requests: Bing treats this as spam, send less often' };
		case null:
			return { tone: 'error', text: 'No response from Bing (network error)' };
		default:
			return { tone: statusCode >= 200 && statusCode < 300 ? 'ok' : 'error', text: `HTTP ${statusCode}` };
	}
}
