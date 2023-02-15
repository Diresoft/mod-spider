import { app } from "$lib/modules/app/application_context";
import type { ModPlan } from "$lib/modules/app/project/ModPlan";
import type { LayoutLoad } from "../$types";

export const ssr		= false;
export const prerender	= false;
export const csr		= true;

export const load = ( async ( data ) => {
	return {
		plan: app.ActivePlan as ModPlan
	}
}) satisfies LayoutLoad;