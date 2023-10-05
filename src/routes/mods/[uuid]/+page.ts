import { Database } from "@lib/db";
import type { PageLoad } from "./$types";

// -- Force classes to get added to the Serializable reverse LUT for hydration
import { NxmMod } from "@lib/adapter/Nexusmods";

export const load: PageLoad = async ( { params } ) => {
	const mod = await Database.get( params.uuid );
	return { mod }
};