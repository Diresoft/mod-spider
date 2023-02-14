import { Database } from "../../meta/database";
import { Guid } from "../../util/Guid";

@Database.Manage
export class ModGroup {
	@Database.PrimaryKey
	public readonly	guid: Guid				= Guid.Create();
	public			name: string			= "New Mod Group";
	public			description: string		= "";
	public			parent: ModGroup|null	= null;
	
	public subgroups: ModGroup[];

	constructor( name: string, description: string, subgroups: ModGroup[] = [] )
	{
		this.name			= name;
		this.description	= description;
		this.subgroups		= subgroups;

		// Mark this as the parent in the subgroups
		for( const subgroup of subgroups )
		{
			subgroup.parent = this;
		}
	}
}