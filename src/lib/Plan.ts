import type { Mod } from "./Mod";
import { Serializable, type Immutable } from "./Serialize";

@Serializable({
	uuidProvider( instance: Immutable<ModPlan> ): string {
		return `plan`;
	}
})
export class ModPlan
{
	protected mods: Set<Mod> = new Set();

	public get allMods(): Mod[]
	{
		return Array.from( this.mods );
	}
	constructor() { }
	
	public add( mod: Mod ): ModPlan
	{
		this.mods.add( mod );
		return this;
	}
}