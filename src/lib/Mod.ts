import { Serializable, UniqueReference } from "./Serialize";

export abstract class Mod
{
	public readonly uuid: string;

	public title: string;
	public description: string;
	
	public requirements: ModLink[] = [];

	constructor( uuid: string )
	{
		this.uuid = uuid;
	}
}
export abstract class ModReference<M extends Mod = Mod> extends UniqueReference<M>
{
	protected async hydrate(target: M, raw_serialized: string): Promise<void>
	{
		const raw_obj = JSON.parse( raw_serialized );
		Object.assign( target, raw_obj );

		for( const [i, req] of target.requirements.entries() )
		{
			target.requirements[i] = new ModLink( req.src, req.tar );
			target.requirements[i].notes = req.notes;
		}
	}
}

export class ModLink
{
	public readonly src:	ModReference;
	public readonly tar:	ModReference;

	public notes: string[] = [];

	constructor( src: ModReference, tar: ModReference )
	{
		this.src = src;
		this.tar = tar;
	}
}