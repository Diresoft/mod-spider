<script lang="ts">
    import { get, writable, type Writable } from "svelte/store";
    import { Database } from "../../../lib/db";
    import ModView from "../../components/ModView.svelte";
    import { page } from "$app/stores";
    import { ModPlan } from "@lib/Plan";
    import { onDestroy, onMount, setContext } from "svelte";
    import { NxmApi, NxmMod } from "@lib/adapter/Nexusmods";
    import { Mod } from "@lib/Mod";
    import { GenericWebMod } from "@lib/adapter/GenericWebMod";
    import { MakeModFromURL } from "@lib/ModHelper";

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

	async function savePlan()
	{
		await Database.put( get( plan ) );
	}

	async function addModFromURL( url: string )
	{
		const mod = await MakeModFromURL( url );
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
	}

	onDestroy( async () => {
		await savePlan();
	})
</script>

<main class="container">
	<header>
		<a href="/">Home</a>
		<h1>Plan: {$plan.name}</h1>
		<input type="text" placeholder="Mod Source" bind:value={add_mod_url} />
		<button on:click={() => addModFromURL(add_mod_url)}>Add Mod</button>
		<button on:click={() => savePlan()}>Save</button>
		<button on:click={() => reload()}>Reload</button>
	</header>

	<mods>
		{#each mods_in_plan as mod }
			<ModView {mod} />
		{/each}
	</mods>

</main>

<style lang='scss'>
	mods {
		margin-top: 10em;

		width: 500px;
		display: flex;
		flex-direction: column;
	}

	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;

		padding: 1em;

		background: #222;
	}
</style>