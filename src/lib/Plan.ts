import { Mod } from "./Mod";
import { Serializable, type Immutable } from "./Serialize";

@Serializable({
	uuidProvider( instance: Immutable<ModPlan> ): string {
		return `plan`;
	}
})
export class ModPlan
{
	protected mods: Map<string, Mod> = new Map();

	public get allMods(): Mod[]
	{
		return Array.from( this.mods.values() );
	}
	constructor() { }
	
	public add( mod: Mod ): ModPlan
	{
		this.mods.set( mod.uuid, mod );
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
	}
	public remove( mod: Mod ): void
	{
		this.mods.delete( mod.uuid );
	}
}