import { writable, type Writable } from "svelte/store";
import { Database } from "../meta/database";
import { Serialize } from "../meta/serialize";
import { Mod, NexusModData } from "../mod/Mod";
import { Guid } from "../util/Guid";
import { ModPlan } from "./project/ModPlan";


export class AppContext
{
	public crumbs : Writable< Array< {text:null|string, href:string, icon:undefined|string, postfix_icon:boolean} > > = writable([]);
	// async setWindowVisibility( window_id : string, state : boolean )
	// {
	// 	throw new Error('Method not implemented.');
	// }
	
}
export const app = new AppContext();

export const SINGLETON_PLAN = new ModPlan();
SINGLETON_PLAN.descriptor.display_title = "My Super Awesome Mod Plan"
SINGLETON_PLAN.descriptor.description	= "A super awesome description for my super awesome plan"

export const TEMP_ALL_MODS = [
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/72772" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/80139" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/22374" )
	),
	new Mod(
		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/79631" )
	)
];

export class ModGroup {
	public readonly	guid: Guid				= Guid.Create();
	public			name: string			= "Mod Group";
	public			description: string		= "Short Description";

	public subgroups: Array<ModGroup>;

	constructor( name: string, description: string, subgroups: Array<ModGroup> = [] )
	{
		this.name			= name;
		this.description	= description;
		this.subgroups		= subgroups;
	}
}


export const TEMP_MOD_GROUPS = new ModGroup( "root", "root", [
	new ModGroup( "Core", "Mods considered required for any playthrough",
	[
		  new ModGroup( "Extenders", "Script and binary extensions" )
		, new ModGroup( "Fixes", "Fixes for the game" )
		, new ModGroup( "Gameplay", "Mods that improve core gameplay")
	] ),
	new ModGroup( "Visuals", "Mods that improve the look of the game",
	[
		  new ModGroup( "ENB", "ENB Series mods" )
		, new ModGroup( "Assets", "Fixes/Improvements for vanilla assets",
		[
			  new ModGroup( "Textures", "Texture specific mods", [
				  new ModGroup( "Characters", "Actor body textures" )
				, new ModGroup( "Clothing", "Outfit textures")
			  ] )
			, new ModGroup( "Models", "Model specific mods" )
			, new ModGroup( "Misc", "Mods that don't cleanly fit into a category" )
		] )
	] ),
	new ModGroup( "Expansions", "Mods that extends the base game",
	[
		  new ModGroup( "Worldbuilding", "Extends the base game's world and lore" )
		, new ModGroup( "Towns", "Expansions or additional towns to fill out the world" )
	] ),
	new ModGroup( "Misc", "Mods that don't fit other categories" )
]);

@Serialize.Manage()
@Database.Manage
class Test {
	@Serialize.ConfigureProperty({
		Transform: {
			out:	( val: string ) => `CUSTOMIZED: ${val}`,
			in:		( val: string ) => `BOOO`
		}
	})
	public testString: string = "I'm a string";
	
	@Serialize.ConfigureProperty( { Ignored: true } )
	public testNum: number = 42;
	
	public testBool: boolean = true;
	public testObj: object = {
		foo: "bar"
	};

	@Database.PrimaryKey
	public testGuid: Guid = Guid.Create();

	public ImAFunction( str: string ): boolean
	{
		
	}
	constructor( )
	{}
}

// const g = Guid.Create();
// const gs = Serialize.toJSON( g, true );
// console.log( `g as Json:\n${ gs }` );

const a = new Test();
a.testString = "Foo Bar Foo";
a.testNum = -42;
a.testBool = false;
a.testObj = { foo: "biz" };

const as = Serialize.toJSON( a, true );
console.log( `a as Json:\n${ as }` );
const parsed: Test = Serialize.fromJSON( as );
console.log( `a parsed:`, parsed, a === parsed, a.testGuid === parsed.testGuid );
