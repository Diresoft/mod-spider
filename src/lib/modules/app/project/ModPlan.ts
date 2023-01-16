import { Guid } from "$lib/modules/util/Guid";

export class ModPlanDescriptor {
	public display_title	: string = "Mod Plan";
	public description		: string = "Loreum Ipsum";
}

export class ModPlan
{
	public readonly guid : Guid = Guid.Create();
	public descriptor : ModPlanDescriptor = new ModPlanDescriptor();
}