<script lang='ts'>
    import { ModPlan } from "@lib/Plan";
    import { Serializable } from "@lib/Serialize";
    import { Database } from "@lib/db";
    import { onMount } from "svelte";
    import { get, writable } from "svelte/store";

	let plan_name: string;

	let all_plans = writable( new Set<ModPlan>() );
	$: all_plans_arr = $all_plans.values();

	onMount( async () => {
		// all_plans.set( await Database.get( 'all_plans' ) ?? new Set() );
		all_plans.set( await getPlans() );
	})

	async function getPlans()
	{
		return ( await Serializable.Hydrate<Set<ModPlan>>( "all_plans" ) ) ?? new Set();;
	}
	async function savePlans()
	{
		await Serializable.GetDataProviderFor( Set ).put( "all_plans", await Serializable.Dehydrate( get( all_plans ) ) );
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
	<header>Plans:</header>
	<section>
		<ul>
			{#each all_plans_arr as plan}
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