<script lang='ts'>
    import type { Mod } from "$lib/Mod";
    import ModRequirement from "./ModRequirement.svelte";

	export let mod: Mod;
</script>
<article>
	<header>
		<h1>{mod.title}</h1>
	</header>
	<section>
		<h2>Requirements:</h2>
		<ul>
			{#each mod.requirements as requirement }
				<ModRequirement link={requirement} />
			{/each}
		</ul>
	</section>
</article>