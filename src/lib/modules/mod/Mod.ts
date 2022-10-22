import { Guid } from "../util/Guid";
import { Serializable } from "../metaprogramming/serialization_decorators";
import type { Reference } from "../database/Reference";

@Serializable
export class Mod
{
	// -~= Properties =~-
	// - Public
	public readonly	guid	: Guid					= Guid.Create();
	
	public title		: string | undefined		= undefined;
	public description	: string | undefined		= undefined;
	public notes		: string | undefined		= undefined;

	public requirements	: Map<Guid, Reference<typeof Mod>>	= new Map();

	// - Private

	// -~= Methods =~-
	// - Static


	// - Constructor
	constructor()
	{
		this.title = "TITLE"
		this.description = "DESCRIPTION"
		this.notes = "NOTES"
	}
}