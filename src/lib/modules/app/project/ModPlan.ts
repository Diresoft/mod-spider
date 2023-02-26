import { Serializable } from "$lib/modules/meta/serializable";
import { SingletonByProperty, SingletonProperty } from "$lib/modules/meta/singleton";
import { Guid } from "$lib/modules/util/Guid";
import { ModGroup } from "./ModGroup";

export class ModPlanDescriptor {
	public display_title	: string = "Mod Plan";
	public description		: string = "Loreum Ipsum";
}

@Serializable()
@SingletonByProperty
export class ModPlan
{
	@SingletonProperty
	public readonly guid : Guid = Guid.Create();
	
	public groups: ModGroup = new ModGroup( "root", "", [] );
	
	public descriptor : ModPlanDescriptor = new ModPlanDescriptor();
}