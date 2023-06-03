import type { LayoutLoad } from "./$types";
import { db } from "$lib/Dexie/database";
import { dexieWritable } from "$lib/Dexie/DexieStore";

export const load = ( ( { params } ) => {
	return {
		plan: dexieWritable( db.plans, params.plan_id )
	}
} ) satisfies LayoutLoad