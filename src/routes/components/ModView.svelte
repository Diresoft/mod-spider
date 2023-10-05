<script lang='ts'>
    import type { Mod } from "$lib/Mod";
    import { getContext } from "svelte";
    import ModRequirement from "./ModRequirement.svelte";
    import type { ModPlan } from "$lib/Plan";
    import type { Writable } from "svelte/store";
    import { goto } from "$app/navigation";

	export let mod: Mod;
	const plan = getContext<Writable<ModPlan>>( "plan" );

	// These are the requirements and incompatibilities currently included in the mod plan.
	$: requirements      = $plan.getModsRequiring      ( mod );
	$: incompatibilities = $plan.getModsIncompatibleWith ( mod );

	function removeMod(){
		plan.update( p => {
			p.remove( mod );
			return p;
		})
	}
</script>
<mod class:incompatible={incompatibilities.length > 0}>
	<cover>
		<img src="{mod.cover_image_uri}" alt="Cover" />
	</cover>
	
<!-- 	
	<header>
		<h1>
			{mod.title}
			{#if incompatibilities.length > 0 }
				<em>- Incompatible!</em>
			{:else if requirements.length > 0 }
				<em>- Required!</em>
			{/if}
		</h1>
		<button on:click={removeMod}>Remove</button>
		<a href={`/mods/${mod.uuid}`}>Edit</a>
		<br/>
		{#if incompatibilities.length > 0 }
			Incompatible With:
			<ul>
				{#each incompatibilities as incompatible }
					<li>{incompatible.title}</li>
				{/each}
			</ul>
		{/if}
		{#if requirements.length > 0 }
			Required By:
			<ul>
				{#each requirements as requirement }
					<li>{requirement.title}</li>
				{/each}
			</ul>
		{/if}
	</header>
	<section>
		<h2>Requirements:</h2>
		<ul>
			{#each mod.requirements as requirement }
				<ModRequirement link={requirement} />
			{/each}
		</ul>
	</section> -->
</mod>

<style lang="scss">
	// article {
	// 	border: solid black 1px;
	// 	padding: 0.5rem;
	// 	margin: 0.5rem;
	// 	border-top-right-radius: 0.5rem;
	// 	border-bottom-right-radius: 0.5rem;
	// 	h1 {
	// 		font-size: 1rem;
	// 	}
	// 	h2 {
	// 		font-size: 0.9rem;
	// 	}

	// 	&.incompatible {
	// 		background-color: rgba( 255, 0, 0, 0.25 );
	// 		border-color: red;
	// 	}

	// 	img {
	// 		width: 5em;
	// 	}
	// }

	mod {
		display: flex;
		flex-direction: row;

		height: 10em;
		width:  100%;
		border: solid 1px grey;
	}

</style>