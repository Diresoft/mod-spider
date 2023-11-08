<script lang='ts'>
    import { ModPlan } from "@lib/Plan";
    import { Serializable } from "@lib/Serialize";
    import { Database } from "@lib/db";
    import { onMount } from "svelte";
    import { get, writable } from "svelte/store";
	
	// Force these types to be processed so they're in the serialization reverse lookup
	import { GenericWebMod } from "@lib/adapter/GenericWebMod";
	import { NxmMod } from "@lib/adapter/Nexusmods";

	let plan_name: string;

	let all_plans = writable( new Set<ModPlan>() );
	
	onMount( async () => {
		// all_plans.set( await Database.get( 'all_plans' ) ?? new Set() );
		all_plans.set( await getPlans() );
	})

	async function getPlans()
	{
		return ( await Database.get<Set<ModPlan>>( 'all_plans' ) ) ?? new Set();
	}
	async function savePlans()
	{
		await Database.put( get( all_plans ), 'all_plans' );
	}

	async function addPlan()
	{
		if( plan_name.length < 1 ) return;

		const newPlan = new ModPlan( plan_name );
		await Database.put( newPlan );
		all_plans.update( all => {
			all.add( newPlan );
			return all;
		})
		await savePlans();
	}

	async function deletePlan( plan: ModPlan )
	{
		await Database.delete( plan.name );
		all_plans.update( all => {
			all.delete( plan );
			return all;
		});
		await savePlans();
	}
</script>

<article>
	<header>Graph:</header>
	<section>
		<ul>
			{#each $all_plans.values() as plan}
				<li>
					<button on:click={()=>{ deletePlan( plan ) }}>-</button>
					<a href="/graph/{plan.name}">{plan.name}</a>
				</li>
			{/each}
		</ul>
	</section>

	<header>Plans:</header>
	<section>
		<ul>
			{#each $all_plans.values() as plan}
				<li>
					<button on:click={()=>{ deletePlan( plan ) }}>-</button>
					<a href="/plan/{plan.name}">{plan.name}</a>
				</li>
			{/each}
		</ul>
	</section>
	
	<section>
		<input type="text" bind:value={plan_name}/>
		<button on:click={addPlan}>Add Plan</button>
	</section>
</article>