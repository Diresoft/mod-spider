import { Serializable } from "$lib/modules/metaprogramming/serialization_decorators";
import { Guid } from "$lib/modules/util/Guid";

@Serializable
export class ModPlanDescriptor {
	public display_title	: string = "Mod Plan";
	public description		: string = "Loreum Ipsum";
}

@Serializable
export class ModPlan
{
	public readonly guid : Guid = Guid.Create();
	public descriptor : ModPlanDescriptor = new ModPlanDescriptor();
}