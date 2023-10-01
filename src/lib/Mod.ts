import { Serializable, type Immutable } from "./Serialize";

@Serializable()
export class ModLink<T extends Mod=Mod>
{
	public readonly ref_uuid: string;
	protected       ref?:      T;

	public async get(): Promise<T>
	{
		return Promise.resolve( this.ref as T );
	}

	constructor( ref_uuid: string, ref?: T )
	{
		this.ref_uuid = ref_uuid;
		this.ref = ref;
	}

	toJSON()
	{
		const out = Object.assign( {}, this );
		console.log( `MODLINK -> TOJSON`, this, '->', out );
		return out;
	}
}

@Serializable({
	uuidProvider( instance: Immutable<Mod> ): string
	{
		return instance.uuid;
	}
})
export class Mod
{
	public readonly uuid: string;
	public title?: string;
	public description?: string;

	public requirements: Set<ModLink> = new Set();
	constructor( uuid: string = crypto.randomUUID() )
	{
		this.uuid = uuid;
	}

	public foo() {}
	
}

