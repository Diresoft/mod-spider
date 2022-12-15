export const prerender	= true
export const ssr		= false

import { SINGLETON_PLAN } from '$lib/modules/app/application_context';
import type { LayoutLoad } from '.svelte-kit/types/src/routes/$types';
 
export const load: LayoutLoad = async ( data ) => {
	const plan = SINGLETON_PLAN; // TODO: Load from database
	return { plan };
} 