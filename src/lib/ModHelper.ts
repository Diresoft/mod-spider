import { Mod, ModLink } from "./Mod";
import { GenericWebMod } from "./adapter/GenericWebMod";
import { NxmApi, NxmMod, NxmModLink } from "./adapter/Nexusmods";
import { Database } from "./db";

export async function MakeModFromURL( url: string ): Promise<Mod>
{
	if ( url.includes( "www.nexusmods.com" ) )
	{
		const uuid = NxmMod.urlToUuid( url );
		if( await Database.has( uuid, NxmMod.prototype ) )
		{
			return Database.get( uuid );
		}
		else
		{
			return new NxmMod( await NxmApi.getModInfo( url ) );
		}
	}
	else
	{
		const uuid = GenericWebMod.urlToUuid( url );
		if( await Database.has( uuid, GenericWebMod.prototype ) )
		{
			return Database.get( uuid );
		}
		else
		{
			return new GenericWebMod( url );
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