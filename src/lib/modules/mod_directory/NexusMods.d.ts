import { ModDirectory } from "./ModDirectory";
import type { ModRecord } from "./ModUri";

export class NexusModsSource extends ModDirectory
{
	// -~= Properties =~-
	// - Public
	
	// - Private

	// -~= Methods =~-
	// - Static


	// - Constructor
	constructor()
	{
		super();
	}
}

export class NexusModRecord extends ModRecord
{
	// -~= Properties =~-
	// - Public
	public nexus_id : number;
	
	// - Private

	// -~= Methods =~-
	// - Static


	// - Constructor
}