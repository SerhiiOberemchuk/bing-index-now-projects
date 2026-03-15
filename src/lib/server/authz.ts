type AppUser = App.Locals['user'];

export type AppRole = 'owner' | 'manager' | 'viewer';

const ROLE_RANK: Record<AppRole, number> = {
	viewer: 1,
	manager: 2,
	owner: 3
};

export function getUserRole(user: AppUser): AppRole {
	const role = user?.role;
	if (role === 'owner' || role === 'manager' || role === 'viewer') return role;
	return 'viewer';
}

export function canManageProjects(user: AppUser): boolean {
	return ROLE_RANK[getUserRole(user)] >= ROLE_RANK.manager;
}

export const MANAGE_PERMISSION_ERROR = 'You do not have permission to perform this action.';
