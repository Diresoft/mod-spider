<script lang="ts">
    import { get, writable, type Writable } from "svelte/store";
    import { Database } from "../../../lib/db_json";
    import ModView from "../../components/ModView.svelte";
    import { page } from "$app/stores";
    import { ModPlan } from "$lib/Plan";
    import { onDestroy, onMount, setContext } from "svelte";
    import { NxmApi, NxmMod } from "$lib/adapter/Nexusmods";
    import { __DEPRECATED__Mod } from "$lib/Mod";
    import { GenericWebMod } from "$lib/adapter/GenericWebMod";
    import { MakeModFromURL } from "$lib/ModHelper";
    import type { Snapshot } from "@sveltejs/kit";
    import { Serializable } from "$lib/Serialize";
	import { save, open} from '@tauri-apps/api/dialog';
	import { documentDir, join } from '@tauri-apps/api/path';
	import { writeTextFile } from '@tauri-apps/api/fs';

	async function loadPlan( name: string )
	{
		const p = await Database.get<ModPlan>( name );
		p.process();
		plan.set( p );

		return p;
	}
	async function reload()
	{
		const p = await Database.get<ModPlan>( get( plan ).name );
		p.process();

		return p;
	}
	async function exportPlan()
	{
		const defaultPath = localStorage.getItem( 'last_export_path' ) ?? await documentDir();
		const fp           = await open({
			defaultPath,
			directory: true,
			multiple:  false,
			title: "Export Location"
		});
		if( Array.isArray( fp ) || fp === null ) throw new Error( `Export path must be selected and singular` );
		localStorage.setItem( 'last_export_path', fp );
		
		const out_path = await join( fp, `${$plan.name}.json` );
		const dehydrated = (await Serializable.Dehydrate( get( plan )))
		const as_str = JSON.stringify( dehydrated.$$value, null, '\t' );

		await writeTextFile( out_path, as_str );
	}

	async function savePlan()
	{
		await Database.put( get( plan ) );
	}

	let new_plan_name: string;
	async function savePlanAs( new_name: string )
	{
		// Change the name of the plan we're working on
		plan.update( p => {
			p.name = new_name;
			return p;
		});

		// Update the index of all plans
		const index = await Database.get<Set<ModPlan>>( 'all_plans' );
		index.add( get( plan ) );
		await Database.put( index , 'all_plans', );

		// Write the new plan to the database
		await Database.put( get( plan ) );
	}

	async function addModFromURL( url: string )
	{
		const mod = await MakeModFromURL( url );
		await Database.put( mod ); // Ensure the mod we just make gets added to the database
		plan.update( p => {
			p.add( mod );
			return p;
		});

		await savePlan();
	}

	let plan_name: string;
	let plan     : Writable<ModPlan> = writable( new ModPlan() );
	setContext( 'plan', plan );
	
	let add_mod_url: string;

	$: plan_name    = $page.params.uuid;
	$: mods_in_plan = $plan.allMods;
	$: {
		loadPlan( plan_name );
		localStorage.setItem( "active_plan_uuid", plan_name );
	}

	onDestroy( async () => {
		await savePlan();
	})

	export const snapshot: Snapshot<{ x: number, y: number }> = {
		capture: () => {
			return {
				x: window.scrollX,
				y: window.scrollY
			}
		},
		restore: ( pos ) => {
			setTimeout( () => {
				window.scroll({
					top:  pos.y,
					left: pos.x,
					behavior: 'instant'
				})
			}, 1 );
		}
	}

	function onWindowKeyUp( e: KeyboardEvent ) {
		if ( e.ctrlKey && e.key === 's' ) {
			savePlan();
		}
	}
</script>

<svelte:window
	on:keyup={ onWindowKeyUp }
/>
<main class="container">
	<header>
		<div class="plan_details">
			<a href="/">Home</a>
			<h1>Plan: {$plan.name}</h1>
			<button on:click={() => savePlan()}>Save</button>
			<button on:click={() => reload()}>Reload</button>
			<button on:click={() => exportPlan()}>Export</button><br/>
			<input type="text" placeholder="New Mod Name" bind:value={new_plan_name} />
			<button on:click={() => savePlanAs( new_plan_name ) }>Save As</button>
		</div>
		<div class="plan_actions">
			<input type="text" placeholder="Mod Source" bind:value={add_mod_url} />
			<button on:click={() => addModFromURL(add_mod_url)}>Add Mod</button>
		</div>
	</header>

	<mods>
		{#each mods_in_plan as mod }
			<ModView {mod} />
		{/each}
	</mods>

</main>

<style lang='scss'>
	main {
		position: relative;

		header {
			display:  block;
			position: sticky;
			z-index: 999;
			top: 0px;

			background: #222;
			padding: 1em;
			margin: 0;

			border: solid #DDD 1px;
			border-top: none;
			border-bottom: solid 1px white;
			border-bottom-left-radius: 1em;
			border-bottom-right-radius: 1em;
		}

		mods {
			display: flex;
			flex-direction: column;

			align-items: stretch;
		}
	}

	header {
		h1 {
			margin-bottom: 0.1em;
		}
		.plan_details {
			border-bottom: solid 3px #DDD;
			padding-bottom: 1.5em;
			margin-bottom: 1.5em;
		}
	}
</style>