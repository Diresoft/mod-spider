import { db } from '$lib/Dexie/database';
import { liveQuery } from 'dexie';
import type { LayoutLoad } from './$types';

export const load = (async ( data ) => {
	return {
		page_url: data.url, // Use this instead of `location.href` as this method ensures components update
		plans: liveQuery( () => db.plans.toArray() )
	};
}) satisfies LayoutLoad;