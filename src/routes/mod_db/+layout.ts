import type { LayoutLoad } from './$types';

export const load = (async ( data ) => {
	return {
		page_url: data.url, // Use this instead of `location.href` as this method ensures components update
	};
}) satisfies LayoutLoad;