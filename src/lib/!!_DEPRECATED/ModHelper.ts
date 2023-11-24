import { __DEPRECATED__Mod, ModLink } from "./Mod";
import { GenericWebMod } from "./GenericWebMod";
import { NxmApi, NxmMod, NxmModLink } from "./Nexusmods";
import { Database } from "./db_json";

export async function MakeModFromURL( inUrl: string ): Promise<__DEPRECATED__Mod>
{
	const url = new URL( inUrl );
	const safe_url = `${url.origin}${url.pathname}`

	if ( url.hostname === "www.nexusmods.com" )
	{
		const uuid = NxmMod.urlToUuid( url.pathname );
		if( await Database.has( uuid, NxmMod.prototype ) )
		{
			return Database.get( uuid );
		}
		else
		{
			return new NxmMod( await NxmApi.getModInfo( safe_url ) );
		}
	}
	else
	{
		const uuid = GenericWebMod.urlToUuid( safe_url );
		if( await Database.has( uuid, GenericWebMod.prototype ) )
		{
			return Database.get( uuid );
		}
		else
		{
			return new GenericWebMod( inUrl );
		}
	}
}

export async function MakeModLinkFromUrl( url: string, note?: string ) {
	if ( url.includes( "www.nexusmods.com" ) )
	{
		return new NxmModLink( { link: url, note: note ?? "" } );
	}
	else
	{
		const mod = await MakeModFromURL( url );
		await Database.put( mod );
		return new ModLink( (await mod).uuid, mod );
	}
}