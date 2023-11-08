import { Mod } from "@lib/Mod";
import { Serializable, type UuidType } from "@lib/Serialize";


@Serializable()
export class GenericWebMod extends Mod
{

	public static urlToUuid( url: string ): UuidType
	{
		return `webmod_${window.btoa( url )}`;
	}
	
	public url:   string;

	constructor( url: string )
	{
		super( GenericWebMod.urlToUuid( url ) );
		this.url = url;
	}
}