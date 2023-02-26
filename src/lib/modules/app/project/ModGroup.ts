import { Serializable } from "$lib/modules/meta/serializable";
import { SingletonByProperty, SingletonProperty } from "$lib/modules/meta/singleton";
import { Guid } from "../../util/Guid";

@Serializable( ( value: any ): ModGroup => {
	return new ModGroup( value.name, value.description, value.subgroups );
})
@SingletonByProperty
export class ModGroup {
	@SingletonProperty
	public readonly	guid: Guid				= Guid.Create();
	public			name: string			= "New Mod Group";
	public			description: string		= "";

	@Serializable.PropertyConfiguration( { Ignored: true } )
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