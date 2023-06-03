import { DexieUtils } from "$lib/Dexie/DexieUtils";

export class ModGroup
{
	public id: string = crypto.randomUUID();

	public name: string;
	public description: string;

	@DexieUtils.Foreign( 'mod_groups' )
	public parent?: ModGroup;
	
	@DexieUtils.Foreign( 'mod_groups' )
	public children: ModGroup[] = [];

	public insert_child( sub_child: ModGroup, index: number = -1 )
	{
		sub_child.parent = this;
		if ( index <= -1 ) this.children.unshift( sub_child );
		else if ( index < this.children.length ) this.children.splice( index + 1, 0, sub_child );
		else this.children.push( sub_child );
	}

	public remove_child( test_child: ModGroup )
	{
		test_child.parent = undefined;
		this.children = this.children.filter( p => p !== test_child );
	}

	constructor( name: string = "New Group", parent?: ModGroup )
	{
		this.parent = parent;

		this.name = name;
		this.description = "Description";
	}
}