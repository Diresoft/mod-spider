<script lang="ts">
    import { Mod, type ModLink } from "$lib/Mod";
	import type { ModPlan } from "$lib/Plan";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

	// Module
	export let   link: ModLink;
	       const plan = getContext<Writable<ModPlan>>( "plan" );

	// Functions
	async function addToPlan()
	{
		if ( !plan ) return;
		is_adding = true;
		const mod = await promise;
		plan.update( p => {
			p.put( mod );
			return p;
		})
		is_adding = false;
	}

	// Dynamic
	$: is_adding = false;
	$: promise = link?.get() ?? Promise.resolve( new Mod());
	$: notPlanned = !$plan.has( link?.ref_uuid );

</script>

{#await promise}
	<li>{link?.ref_uuid} -LOADING</li>
{:then mod} 
	
<li class:notPlanned>
	<article>
		<header>{mod.title}</header>
		{#if notPlanned }
			<button on:click={addToPlan} disabled={is_adding}>Add</button>
		{/if}
	</article>
</li>
{/await}

<style lang="scss">
	li {
		color: green;
		&.notPlanned {
			color: orange;
		}
	}
</style>