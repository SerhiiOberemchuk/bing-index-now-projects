export const PROJECT_SCHEDULES = ['disabled', 'every_6h', 'daily', 'weekly'] as const;

export type ProjectSchedule = (typeof PROJECT_SCHEDULES)[number];

export const PROJECT_SCHEDULE_LABEL: Record<ProjectSchedule, string> = {
	disabled: 'Disabled',
	every_6h: 'Every 6 hours',
	daily: 'Daily',
	weekly: 'Weekly'
};

export function isProjectSchedule(value: string): value is ProjectSchedule {
	return PROJECT_SCHEDULES.includes(value as ProjectSchedule);
}

export function computeNextRunAt(schedule: ProjectSchedule, fromDate = new Date()): Date | null {
	const from = new Date(fromDate);

	switch (schedule) {
		case 'disabled':
			return null;
		case 'every_6h':
			return new Date(from.getTime() + 6 * 60 * 60 * 1000);
		case 'daily':
			return new Date(from.getTime() + 24 * 60 * 60 * 1000);
		case 'weekly':
			return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
		default:
			return null;
	}
}
