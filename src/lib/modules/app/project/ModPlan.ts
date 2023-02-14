import { Database } from "$lib/modules/meta/database";
import { Guid } from "$lib/modules/util/Guid";

export class ModPlanDescriptor {
	public display_title	: string = "Mod Plan";
	public description		: string = "Loreum Ipsum";
}

@Database.Manage
export class ModPlan
{
	@Database.PrimaryKey
	public readonly guid : Guid = Guid.Create();
	
	public descriptor : ModPlanDescriptor = new ModPlanDescriptor();
}