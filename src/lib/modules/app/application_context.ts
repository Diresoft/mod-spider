import { writable, type Writable } from "svelte/store";
import { DoNotSerialize, JsonDeserialize, JsonSerialize, Serializable, type Dehydrated } from "../metaprogramming/serialization_decorators";
import { ModPlan } from "./project/ModPlan";


@Serializable
export class AppContext
{
	
}
export const app = new AppContext();

export const SINGLETON_PLAN = new ModPlan();
SINGLETON_PLAN.descriptor.display_title = "My Super Awesome Mod Plan"
SINGLETON_PLAN.descriptor.description	= "A super awesome description for my super awesome plan"

export const crumbs : Writable< Array< {text:null|string, href:string, icon:undefined|string, postfix_icon:boolean} > > = writable([]);