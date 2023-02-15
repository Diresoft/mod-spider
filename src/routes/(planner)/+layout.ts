import type { LayoutLoad } from './$types';

export const ssr		= false;
export const prerender	= false;
export const csr		= true;
 
export const load = ( async ( data ) => {
	return {
		pathname: data.url.pathname
	};
}) satisfies LayoutLoad;