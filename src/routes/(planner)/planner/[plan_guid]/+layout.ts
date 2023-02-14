export const prerender	= true
export const ssr		= false

import { ModPlan } from '$lib/modules/app/project/ModPlan';
import { Database } from '$lib/modules/meta/database';
import { Guid } from '$lib/modules/util/Guid';
import type { LayoutLoad } from '.svelte-kit/types/src/routes/$types';
import { error } from '@sveltejs/kit';
 
export const load: LayoutLoad = async ( { params } ) => {
	if ( params.plan_guid === undefined ) error( 404 );

	// Convert the GUID string to a GUID reference, as that's how it's stored in the DB
	const selected_plan_guid: Guid = Guid.From( params.plan_guid );
	const plan = Database.get( ModPlan ).byPrimaryKey().where( selected_plan_guid );

	return {
		plan
	}
} 