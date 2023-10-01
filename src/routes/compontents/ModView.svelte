<script lang='ts'>
    import type { Mod } from "$lib/Mod";
    import { getContext } from "svelte";
    import ModRequirement from "./ModRequirement.svelte";
    import type { ModPlan } from "$lib/Plan";
    import type { Writable } from "svelte/store";

	export let mod: Mod;
	const plan = getContext<Writable<ModPlan>>( "plan" );

	function removeMod(){
		plan.update( p => {
			p.remove( mod );
			return p;
		})
	}
</script>
<article>
	<header>
		<h1>{mod.title}</h1>
		<button on:click={removeMod}>Remove</button>
	</header>
	<section>
		<h2>Requirements:</h2>
		<ul>
			{#each mod.requirements as requirement }
				{@const isNotValid = requirement === null}
				{isNotValid}
				<ModRequirement link={requirement} />
			{/each}
		</ul>
	</section>
</article>

<style lang="scss">
	article {
		border: solid black 1px;
		padding: 0.5rem;
		margin: 0.5rem;
		border-top-right-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
		h1 {
			font-size: 1rem;
		}
		h2 {
			font-size: 0.9rem;
		}
	}
</style>