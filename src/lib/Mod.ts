import { Serializable } from "./Serialize";

@Serializable()
export class ModLink<T extends Mod=Mod>
{
	public readonly ref_uuid: string;
	protected       ref:      T;

	public async get(): Promise<T>
	{
		return Promise.resolve( this.ref );
	}

	constructor( ref_uuid: string, ref?: T )
	{
		this.ref_uuid = ref_uuid;
		this.ref = ref;
	}

	toJSON()
	{
		return { ref_uuid: this.ref_uuid }
	}
}

@Serializable()
export class Mod
{
	public readonly uuid: string;
	public title: string;
	public description: string;

	public requirements: Set<ModLink> = new Set();
	constructor( uuid: string = crypto.randomUUID() )
	{
		this.uuid = uuid;
	}

	public foo() {}
	
}

