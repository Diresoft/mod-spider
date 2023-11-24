import { Serializable, type Immutable } from "./Serialize";

@Serializable({
	async dehydrator( hydrated: Immutable<ModLink> ): Promise<any>
	{
		const out = Object.assign( {}, hydrated ) as ModLink & { ref: any };
		delete out.ref; // `ref` is a protected member, but we want to fully remove it from the output
		return out;
	}
})
export class ModLink<T extends __DEPRECATED__Mod=__DEPRECATED__Mod>
{
	public readonly ref_uuid: string;
	protected       ref?:      T;
	public async get(): Promise<T>
	{
		try {
			this.ref = await Serializable.Hydrate( this.ref_uuid );
		} catch( _ ) {}
		return this.ref as T;
	}

	constructor( ref_uuid: string, ref?: T )
	{
		this.ref_uuid = ref_uuid;
		this.ref = ref;
	}
}

@Serializable({
	uuidProvider( instance: Immutable<__DEPRECATED__Mod> ): string
	{
		return instance.uuid;
	}
})
export abstract class __DEPRECATED__Mod
{
	public readonly uuid: string;

	public title?: string;
	public description?: string;
	public notes?: string;

	public cover_image_uri: string = "/favicon.png";

	public requirements: Set<ModLink> = new Set();
	public incompatible: Set<ModLink> = new Set();
	
	constructor( uuid: string = crypto.randomUUID() )
	{
		this.uuid = uuid;
	}
}