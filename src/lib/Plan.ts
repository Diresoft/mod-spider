import { Mod, ModLink } from "./Mod";
import { Serializable, type Immutable } from "./Serialize";

export type LinkDetail = { requiredBy: Mod, notes: string };

@Serializable({
	uuidProvider( instance: Immutable<ModPlan> ): string {
		return instance.name;
	}
})
export class ModPlan
{
	public name: string;
	protected mods: Map<string, Mod> = new Map();
	public required_by_lut:       Map<string, Mod[]> = new Map();
	public incompatible_with_lut: Map<string, Mod[]> = new Map();

	public get allMods(): Mod[]
	{
		return Array.from( this.mods.values() );
	}
	constructor( name: string = 'plan' ) {
		this.name = name;
	}
	
	public add( mod: Mod ): ModPlan
	{
		this.mods.set( mod.uuid, mod );
		this.process();
		return this;
	}
	public has( mod: Mod|string ): boolean
	{
		const uuid = mod instanceof Mod ? mod.uuid : mod;
		return this.mods.has( uuid );
	}
	public put( mod: Mod ): void
	{
		this.mods.set( mod.uuid, mod );
		this.process();
	}
	public remove( mod: Mod ): void
	{
		this.mods.delete( mod.uuid );
		this.process();
	}

	public process()
	{
		this.required_by_lut      = new Map();
		this.incompatible_with_lut = new Map();
		
		for( const mod_target of this.mods.values() )
		{
			if ( !this.required_by_lut.has( mod_target.uuid ) )
			{
				this.required_by_lut.set( mod_target.uuid, [] );
			}
			const req_lut = this.required_by_lut.get( mod_target.uuid ) as Mod[];

			if ( !this.incompatible_with_lut.has( mod_target.uuid ) )
			{
				this.incompatible_with_lut.set( mod_target.uuid, [] );
			}
			const inc_lut = this.incompatible_with_lut.get( mod_target.uuid ) as Mod[];

			// console.log( `Finding all mods which require ${mod_target.title}` );
			for ( const mod_source of this.mods.values() )
			{
				if ( mod_target === mod_source ) continue; // Skip self

				for( const link of mod_source.requirements )
				{
					if ( link.ref_uuid === mod_target.uuid )
					{
						// console.log( `\t- ${mod_source.title} has ${mod_target.title} linked in it's requirements` );
						req_lut.push( mod_source );
						break;
					}
				}

				for( const link of mod_source.incompatible )
				{
					if ( link.ref_uuid === mod_target.uuid )
					{
						// console.log( `\t- ${mod_source.title} has ${mod_target.title} linked in it's incompatibilities` );
						inc_lut.push( mod_source );
						break;
					}
				}
			}
		}
	}

	public getModsRequiring( mod: Mod ): Readonly<Mod>[]
	{
		return this.required_by_lut.get( mod.uuid ) ?? [];
	}

	public getModsIncompatibleWith( mod: Mod): Readonly<Mod>[]
	{
		return this.incompatible_with_lut.get( mod.uuid ) ?? [];
	}
}