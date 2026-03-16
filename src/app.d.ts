// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
			user: {
				id: string;
				email: string;
				name: string;
				role?: 'owner' | 'manager' | 'viewer' | string;
				approved?: boolean;
				image?: string | null;
			} | null;
		}

		interface PageData {
			session: App.Locals['session'];
			user: App.Locals['user'];
		}
	}
}

export {};
