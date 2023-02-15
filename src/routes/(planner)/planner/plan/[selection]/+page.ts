import { ModGroup, TEMP_MOD_GROUPS } from '$lib/modules/app/application_context';
import { Database } from '$lib/modules/meta/database';
import { Guid } from '$lib/modules/util/Guid';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ( data ) => {
	const TEMP_PARAMS_SELECTION: string = TEMP_MOD_GROUPS.guid.toString();
	console.log( `Should load GUID: ${data.params.selection} but forcing root (${TEMP_PARAMS_SELECTION}) for testing` );

	const selected_group_guid: Guid = Guid.From( data.params.selection );
	const lut = Database.get( ModGroup ).byPrimaryKey();
	for( const entry of lut.lut.entries() )
	{
		const guid_str = entry[0].value;
		if ( guid_str === data.params.selection )
		{
			console.log( `Found selection: ${guid_str}`, entry[0].value, lut.lut.get( selected_group_guid ) );
		}
	}
	
	console.log( lut.lut, lut.where( selected_group_guid ) );
}