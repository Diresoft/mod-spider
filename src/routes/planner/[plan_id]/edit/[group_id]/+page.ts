import type { ModGroup } from "$lib/app/plan/ModGroup";
import type { PageLoad } from "./$types";
import { db } from "$lib/Dexie/database";
import { dexieWritable } from "$lib/Dexie/DexieStore";

export const load = ( ( {params} ) => {
	return {
		group: dexieWritable( db.mod_groups, params.group_id )
	}
}) satisfies PageLoad