import { and, eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { authThrottle } from '$lib/server/db/schema';

export type AuthThrottleAction = 'sign_in' | 'sign_up' | 'forgot_password';

type Policy = {
	windowMs: number;
	maxAttempts: number;
	lockMs: number;
};

const POLICIES: Record<AuthThrottleAction, Policy> = {
	sign_in: { windowMs: 15 * 60 * 1000, maxAttempts: 5, lockMs: 30 * 60 * 1000 },
	sign_up: { windowMs: 60 * 60 * 1000, maxAttempts: 5, lockMs: 60 * 60 * 1000 },
	forgot_password: { windowMs: 60 * 60 * 1000, maxAttempts: 5, lockMs: 60 * 60 * 1000 }
};

function nowDate(): Date {
	return new Date();
}

export function createThrottleKey(ip: string, email?: string): string {
	const normalizedEmail = email ? email.trim().toLowerCase() : '';
	return normalizedEmail ? `${ip}:${normalizedEmail}` : ip;
}

export async function checkThrottle(action: AuthThrottleAction, key: string): Promise<{ blocked: boolean; retryAfterSec: number }> {
	const db = getDb();
	const [row] = await db
		.select()
		.from(authThrottle)
		.where(and(eq(authThrottle.action, action), eq(authThrottle.throttleKey, key)))
		.limit(1);

	if (!row?.lockedUntil) {
		return { blocked: false, retryAfterSec: 0 };
	}

	const now = nowDate();
	if (row.lockedUntil > now) {
		return {
			blocked: true,
			retryAfterSec: Math.max(1, Math.ceil((row.lockedUntil.getTime() - now.getTime()) / 1000))
		};
	}

	await db
		.update(authThrottle)
		.set({ lockedUntil: null, updatedAt: now })
		.where(eq(authThrottle.id, row.id));

	return { blocked: false, retryAfterSec: 0 };
}

export async function clearThrottle(action: AuthThrottleAction, key: string): Promise<void> {
	const db = getDb();
	await db.delete(authThrottle).where(and(eq(authThrottle.action, action), eq(authThrottle.throttleKey, key)));
}

export async function recordThrottleFailure(action: AuthThrottleAction, key: string): Promise<{ locked: boolean; retryAfterSec: number }> {
	const db = getDb();
	const policy = POLICIES[action];
	const now = nowDate();

	const [row] = await db
		.select()
		.from(authThrottle)
		.where(and(eq(authThrottle.action, action), eq(authThrottle.throttleKey, key)))
		.limit(1);

	if (!row) {
		await db.insert(authThrottle).values({
			action,
			throttleKey: key,
			attemptCount: 1,
			windowStartedAt: now,
			lastAttemptAt: now,
			updatedAt: now
		});
		return { locked: false, retryAfterSec: 0 };
	}

	if (row.lockedUntil && row.lockedUntil > now) {
		return {
			locked: true,
			retryAfterSec: Math.max(1, Math.ceil((row.lockedUntil.getTime() - now.getTime()) / 1000))
		};
	}

	const sameWindow = now.getTime() - row.windowStartedAt.getTime() <= policy.windowMs;
	const nextAttemptCount = sameWindow ? row.attemptCount + 1 : 1;
	const nextWindowStart = sameWindow ? row.windowStartedAt : now;
	const shouldLock = nextAttemptCount >= policy.maxAttempts;
	const nextLockedUntil = shouldLock ? new Date(now.getTime() + policy.lockMs) : null;

	await db
		.update(authThrottle)
		.set({
			attemptCount: nextAttemptCount,
			windowStartedAt: nextWindowStart,
			lastAttemptAt: now,
			lockedUntil: nextLockedUntil,
			updatedAt: now
		})
		.where(eq(authThrottle.id, row.id));

	return {
		locked: shouldLock,
		retryAfterSec: shouldLock && nextLockedUntil ? Math.max(1, Math.ceil((nextLockedUntil.getTime() - now.getTime()) / 1000)) : 0
	};
}

export async function recordThrottleAttempt(action: AuthThrottleAction, key: string): Promise<{ locked: boolean; retryAfterSec: number }> {
	return recordThrottleFailure(action, key);
}

export function formatRetryAfter(retryAfterSec: number): string {
	if (retryAfterSec < 60) return `${retryAfterSec}s`;
	const minutes = Math.ceil(retryAfterSec / 60);
	return `${minutes}m`;
}
