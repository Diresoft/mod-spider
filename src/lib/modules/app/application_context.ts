import { writable, type Writable } from "svelte/store";
import { Database } from "../metaprogramming/database_decorators";
import { DoNotSerialize, JsonDeserialize, JsonSerialize, Serializable, type Dehydrated } from "../metaprogramming/serialization_decorators";
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

@Serializable
@Database.Manage
class DatabaseTest
{
	@Database.Key
	public str: string;

	@Database.PrimaryKey
	public readonly id: Guid;

	@Database.Key
	public get test(): string
	{
		return "Hello World";
	}

	constructor( guid: Guid = Guid.Create(), str: string = "Hello World" )
	{
		this.id = guid;
		this.str = str;
	}
}

const t1: DatabaseTest = new DatabaseTest();
const t2: DatabaseTest = new DatabaseTest();
const t3: DatabaseTest = new DatabaseTest( t1.id );
// const t4: DatabaseTest = Database.Get(DatabaseTest)//.byKey( 'test', t1.str ) as DatabaseTest;

t1.str = "Foo Bar";
console.log( JsonSerialize( t1 ) );

// console.log( 'Comparisons', t1, t2, t3, t4, t1 === t3, t1 === t2, t4 == t1 );