import { writable, type Writable } from "svelte/store";
import { Serialize } from "../meta/serialize";


@Serialize.Manage()
export class AppContext
{
	@Serialize.ConfigureProperty({ })
	public crumbs : Writable< Array< {text:null|string, href:string, icon:undefined|string, postfix_icon:boolean} > > = writable([]);
}
export const app = new AppContext();




// export const SINGLETON_PLAN = new ModPlan();
// SINGLETON_PLAN.descriptor.display_title = "My Super Awesome Mod Plan"
// SINGLETON_PLAN.descriptor.description	= "A super awesome description for my super awesome plan"

// export const TEMP_ALL_MODS = [
// 	new Mod(
// 		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/72772" )
// 	),
// 	new Mod(
// 		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/80139" )
// 	),
// 	new Mod(
// 		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/22374" )
// 	),
// 	new Mod(
// 		new NexusModData( "https://www.nexusmods.com/skyrimspecialedition/mods/79631" )
// 	)
// ];


// const _mod_groups_temp = new ModGroup( "root", "root", [
// 	new ModGroup( "Core", "Mods considered required for any playthrough",
// 	[
// 		  new ModGroup( "Extenders", "Script and binary extensions" )
// 		, new ModGroup( "Fixes", "Fixes for the game" )
// 		, new ModGroup( "Gameplay", "Mods that improve core gameplay")
// 	] ),
// 	new ModGroup( "Visuals", "Mods that improve the look of the game",
// 	[
// 		  new ModGroup( "ENB", "ENB Series mods" )
// 		, new ModGroup( "Assets", "Fixes/Improvements for vanilla assets",
// 		[
// 			  new ModGroup( "Textures", "Texture specific mods", [
// 				  new ModGroup( "Characters", "Actor body textures" )
// 				, new ModGroup( "Clothing", "Outfit textures")
// 			  ] )
// 			, new ModGroup( "Models", "Model specific mods" )
// 			, new ModGroup( "Misc", "Mods that don't cleanly fit into a category" )
// 		] )
// 	] ),
// 	new ModGroup( "Expansions", "Mods that extends the base game",
// 	[
// 		  new ModGroup( "Worldbuilding", "Extends the base game's world and lore" )
// 		, new ModGroup( "Towns", "Expansions or additional towns to fill out the world" )
// 	] ),
// 	new ModGroup( "Misc", "Mods that don't fit other categories" )
// ]);

// export const TEMP_MOD_GROUPS = _mod_groups_temp