import { db } from "../database/Database";
import { DoNotSerialize, JsonDeserialize, JsonSerialize, Serializable, type Dehydrated } from "../metaprogramming/serialization_decorators";
import { Guid } from "../util/Guid";
import type { Constructor } from "../util/types";
import { ModPlan } from "./project/ModPlan";


@Serializable
export class AppContext
{
	
}
export const app = new AppContext();

const plan = new ModPlan();