import { __DEPRECATED__Mod } from "$lib/typescript/adapter/Mod";
import { Serializable, type UuidType } from "$lib/typescript/adapter/Serialize";


@Serializable()
export class GenericWebMod extends __DEPRECATED__Mod
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