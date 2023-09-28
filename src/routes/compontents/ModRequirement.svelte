<script lang="ts">
    import type { ModLink } from "$lib/Mod";
	import type { ModPlan } from "$lib/Plan";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

	export let link: ModLink;
	const plan = getContext<Writable<ModPlan>>( "plan" );

	$: promise = link.get();
	$: alreadyPlanned = $plan.has( link.ref_uuid );
</script>

<div class:alreadyPlanned>
	{#await promise}
		<li>{link.ref_uuid} -LOADING</li>
	{:then req_mod} 
		<li>{req_mod.title}</li>
	{/await}
</div>