<script lang="ts">
    import { get, writable } from "svelte/store";
    import { Mod } from "./lib/Mod";
    import { NxmApi, NxmMod } from "./adapter/Nexusmods";
    import { onDestroy, onMount, setContext } from "svelte";
    import { scopedStorage, scopedStorageDataProvider } from "./adapter/scopedLocalStorage";
    import { ModPlan } from "./lib/Plan";
    import { Database } from "./lib/db";
    import { Serializable } from "./lib/Serialize";

	const globalProvider = new scopedStorageDataProvider( '' );

	// Add the loaded plan to the context
	const plan = writable( new ModPlan() );
	$: plan_arr = $plan.allMods;
	setContext( "plan", plan );

	onMount( async () => {
		await load();
	})
	onDestroy( async () => {
		await save();
	})

	async function load()
	{
		const ref = { $$ref: 'plan', $$type: 'ModPlan' };
		const hydrated = await Serializable.Hydrate( ref, globalProvider );
		console.log( `Loaded: `, hydrated );
	}

	async function save()
	{
		// Save plan to local storage
		globalProvider.put( 'plan', await Serializable.Dehydrate( get( plan ), globalProvider ) );
	}

	async function addModFromURL( url: string )
	{
		const nmMod = new NxmMod( await NxmApi.getModInfo( url ) );
		plan.update( p => {
			p.add( nmMod )
			console.log( p );
			return p;
		 } );
	}

	let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/93962";
	// let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/32444";
</script>

<main class="container">

	<input type="text" placeholder="Nexusmods URL" bind:value={nexusmodsUrl} />
	<button on:click={() => addModFromURL(nexusmodsUrl)}>Add Mod</button>
	<button on:click={() => save()}>Save</button>
	<button on:click={() => load()}>Load</button>

	{#each plan_arr as mod }
		<article>
			<header>
				<h1>{mod.title}</h1>
			</header>
			<section>
				<h2>Requirements:</h2>
				<ul>
					{#each mod.requirements as requirement }
						{@const promise = requirement.get()}
						{#await promise}
							<li>{requirement.ref_uuid} -LOADING</li>
						{:then req_mod} 
							<li>{req_mod.title}</li>
						{/await}
					{/each}
				</ul>
			</section>
		</article>
	{/each}

</main>

<style>
</style>