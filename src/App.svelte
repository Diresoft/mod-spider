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

	// onMount( async () => {
	// 	await load();
	// })
	// onDestroy( async () => {
	// 	await save();
	// })

	// async function load()
	// {
	// 	const hydrated = await Serializable.HydrateFromUuid( 'plan', globalProvider )
	// 	console.log( `Loaded: `, hydrated );
	// }

	// async function save()
	// {
	// 	// Save plan to local storage
	// 	globalProvider.put( 'plan', await Serializable.Dehydrate( get( plan ), globalProvider ) );
	// }

	@Serializable()
	class Foo {
		public myVal = "Foo";
		public set = new Set();
	}
	async function addModFromURL( url: string )
	{
		// const nmMod = new NxmMod( await NxmApi.getModInfo( url ) );
		// plan.update( p => {
		// 	p.add( nmMod )
		// 	console.log( p );
		// 	return p;
		//  } );

		const test = new Foo();
		test.set.add( url );
		const test2 = new Foo();
		test2.myVal = 'Foo 2';
		test2.set.add( "BOO" );
		test2.set.add( test );
		test.set.add( test2 );

		console.log( `test`, test );
		const test_d = await Serializable.Dehydrate( test, globalProvider );
		console.log( `test_d`, test_d );
		const test_s = JSON.stringify( test_d );
		console.log( `test_s`, test_s );
		// const test_h = await Serializable.Hydrate( test_d, globalProvider );
		// console.log( `test_h`, test_h );
	}

	let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/93962";
	// let nexusmodsUrl: string = "https://www.nexusmods.com/skyrimspecialedition/mods/32444";
</script>

<main class="container">

	<input type="text" placeholder="Nexusmods URL" bind:value={nexusmodsUrl} />
	<button on:click={() => addModFromURL(nexusmodsUrl)}>Add Mod</button>
	<!-- <button on:click={() => save()}>Save</button>
	<button on:click={() => load()}>Load</button> -->

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