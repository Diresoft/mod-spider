import { get, writable, type Writable } from "svelte/store";
import { __DEPRECATED__Mod, ModLink } from "./Mod";
import { Serializable, type Immutable, type JsonType } from "./Serialize";
import { NxmMod, type NxmFile } from "./Nexusmods";
import { Database } from "./db_json";

export class PlanModData
{
	public isInstalled:   boolean     = false;
	public selectedFiles: Set<string> = new Set();
	public skipped_requirements: Set<string> = new Set();
}

@Serializable({
	uuidProvider( instance: Immutable<ModPlan> ): string {
		return instance.name;
	},
	async dehydrator( instance: Immutable<ModPlan> ): Promise<any> {
		let out = Object.assign( {}, instance ) as Partial<ModPlan>;

		out.mods = new Set( (instance as ModPlan).mods.keys() ) as any;
		delete out.incompatible_with_lut;
		delete out.required_by_lut;

		const mod_data = out.plan_data as Map<string, Writable<PlanModData>>;
		for( const [ key, data ] of mod_data ) {
			let pd;
			try {
				pd = get( data );
			}catch(_) {
				pd = data;
			}
			out.plan_data?.set( key, pd as any );
		}

		return out;
	},
	async hydrator( data: any ): Promise<ModPlan> {
		let out = (data ?? {}) as Partial<(JsonType<ModPlan> & { mods: Map<string, __DEPRECATED__Mod> })>;

		const mod_ids = (out?.mods ?? new Set()) as any as Set<string>;
		out.mods = new Map();

		for( const id of mod_ids )
		{
			out.mods.set( id, await Database.get( id ) );
		}

		const mod_data = out.plan_data as Map<string, PlanModData>;
		out.plan_data = new Map();
		for( const [ key, data ] of mod_data )
		{
			(out.plan_data as Map<string, Writable<PlanModData>>).set( key, writable( data ) );
		} 
		
		return out as ModPlan;
	}
})
export class ModPlan
{
	// Saved Properties
	public name: string;
	public mods: Map<string, __DEPRECATED__Mod>              = new Map();
	public plan_data: Map<string, Writable<PlanModData>> = new Map();
	public tag_lut: Map<string, string[]>      = new Map();

	// Transient Properties
	public required_by_lut:       Map<string, __DEPRECATED__Mod[]> = new Map();
	public incompatible_with_lut: Map<string, __DEPRECATED__Mod[]> = new Map();
	

	public get allMods(): __DEPRECATED__Mod[]
	{
		return Array.from( this.mods.values() );
	}

	public get modsByGroup(): Map<string, __DEPRECATED__Mod[]>
	{
		let out = new Map();

		return out;
	}

	constructor( name: string = 'plan' ) {
		this.name = name;
	}
	
	public tagMod( mod: __DEPRECATED__Mod, tag: string )
	{
		if ( !this.tag_lut.has( mod.uuid ) )
		{
			this.tag_lut.set( mod.uuid, [] );
		}
		( this.tag_lut.get( mod.uuid ) as string[] ).push( tag );
	}

	public add( mod: __DEPRECATED__Mod ): ModPlan
	{
		this.mods.set( mod.uuid, mod );
		this.process();
		return this;
	}
	public has( mod: __DEPRECATED__Mod|string ): boolean
	{
		const uuid = mod instanceof __DEPRECATED__Mod ? mod.uuid : mod;
		return this.mods.has( uuid );
	}
	public put( mod: __DEPRECATED__Mod ): void
	{
		this.mods.set( mod.uuid, mod );
		this.process();
	}
	public remove( mod: __DEPRECATED__Mod ): void
	{
		this.mods.delete( mod.uuid );
		this.plan_data.delete( mod.uuid ); // Remove data for this mod too
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
			const req_lut = this.required_by_lut.get( mod_target.uuid ) as __DEPRECATED__Mod[];

			if ( !this.incompatible_with_lut.has( mod_target.uuid ) )
			{
				this.incompatible_with_lut.set( mod_target.uuid, [] );
			}
			const inc_lut = this.incompatible_with_lut.get( mod_target.uuid ) as __DEPRECATED__Mod[];

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

	public getModsRequiring( mod: __DEPRECATED__Mod ): Readonly<__DEPRECATED__Mod>[]
	{
		return this.required_by_lut.get( mod.uuid ) ?? [];
	}

	public getModsIncompatibleWith( mod: __DEPRECATED__Mod): Readonly<__DEPRECATED__Mod>[]
	{
		return this.incompatible_with_lut.get( mod.uuid ) ?? [];
	}

	public getDataFor( mod: __DEPRECATED__Mod ): Writable<PlanModData>
	{
		let pd = this.plan_data.get( mod.uuid ) ?? writable( new PlanModData() );
		this.plan_data.set( mod.uuid, pd );
		return pd;
	}
}