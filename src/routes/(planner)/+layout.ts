export const prerender	= false
export const ssr		= false
export const csr		= true

import { SINGLETON_PLAN } from '$lib/modules/app/application_context';
import type { LayoutLoad } from '.svelte-kit/types/src/routes/$types';
 
export const load: LayoutLoad = async ( {params} ) => {
	if ( !params.guid ){
		return null;
	}
	const plan = SINGLETON_PLAN; // TODO: Load from database
	return { plan };
} 