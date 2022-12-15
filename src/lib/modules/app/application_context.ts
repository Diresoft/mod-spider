import { writable, type Writable } from "svelte/store";
import { DoNotSerialize, JsonDeserialize, JsonSerialize, Serializable, type Dehydrated } from "../metaprogramming/serialization_decorators";
import { Mod, NexusModData } from "../mod/Mod";
import { ModPlan } from "./project/ModPlan";


export class AppContext
{
	public crumbs : Writable< Array< {text:null|string, href:string, icon:undefined|string, postfix_icon:boolean} > > = writable([]);
	// async setWindowVisibility( window_id : string, state : boolean )
	// {
	// 	throw new Error('Method not implemented.');
	// }
	
}
export const app = new AppContext();

export const SINGLETON_PLAN = new ModPlan();
SINGLETON_PLAN.descriptor.display_title = "My Super Awesome Mod Plan"
SINGLETON_PLAN.descriptor.description	= "A super awesome description for my super awesome plan"

export const TEMP_ALL_MODS = [
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/72772" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/80139" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/22374" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/79631" )
	)
];

