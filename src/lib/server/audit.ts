import { getDb } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';

type AuditInput = {
	actorUserId?: string | null;
	actorEmail?: string | null;
	action: string;
	targetType?: string | null;
	targetId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	metadata?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
	const db = getDb();
	await db.insert(auditLog).values({
		actorUserId: input.actorUserId ?? null,
		actorEmail: input.actorEmail ?? null,
		action: input.action,
		targetType: input.targetType ?? null,
		targetId: input.targetId ?? null,
		ipAddress: input.ipAddress ?? null,
		userAgent: input.userAgent ?? null,
		metadata: input.metadata ?? null
	});
}
