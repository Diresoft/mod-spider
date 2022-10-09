
import { Guid } from "$lib/util/guid";
import { Deserializer } from "$lib/util/serializable";


class Mod
{
	public readonly guid	: Guid			= new Guid();
	protected nexus_id		: number | null	= null;
	public name : string;

	constructor( name : string )
	{
		this.name = name;
	}
}

class ModLibrary
{
	public _library : Map<Guid, Mod> = new Map();
}

export class ApplicationContext
{
	public mod_library : ModLibrary = new ModLibrary();
	ingestMod( nexus_id : number ) : void
	{
		//console.log( `ingest mod with id: ${nexus_id}` )
	}
}

export const app = new ApplicationContext();

app.ingestMod( 266 ); // USSEP - https://www.nexusmods.com/skyrimspecialedition/mods/266


const testmod = new Mod( "TEST" );
app.mod_library._library.set( testmod.guid, testmod );

// console.log( app );
const str = JSON.stringify( testmod, null, '\t');
console.log( str );
const test = JSON.parse( str, Deserializer )
console.log( test );