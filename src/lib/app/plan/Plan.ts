import { DexieUtils } from "$lib/Dexie/DexieUtils";
import { ModGroup } from "./ModGroup";

export class Plan
{
	// PRIMARY DATABASE KEY
	public id: string = crypto.randomUUID();
	
	public name:        string;
	public description: string;

	@DexieUtils.Foreign( 'mod_groups' )
	public group_root = new ModGroup( "root" );

	constructor( name: string, description: string )
	{
		this.name        = name;
		this.description = description;
	}

}
