<script lang='ts'>
    import { page } from "$app/stores";
    import { ModGroup } from "$lib/app/plan/ModGroup";
    import { db } from "$lib/Dexie/database";
    import { dexieWritable } from "$lib/Dexie/DexieStore";
    import { children } from "svelte/internal";

	// Page Data

	// Properties
	export let node: ModGroup;
	export let no_info: boolean = false;

	// Reactive
	$: group = dexieWritable( db.mod_groups, node.id )
	$: plan = $page.data.plan;
	$: plan_id = $plan.id;

	// Handlers
	function addChild()
	{
		group.update( g => {
			g.insert_child( new ModGroup( "Child" ) );
			return g;
		})
	}

</script>

{#if $group === undefined }
...loading
{:else}
<article>
	{#if !no_info}
		<header>
			<h1><a href="/plans/{plan_id}/{$group.id}" data-sveltekit-noscroll>{$group.name}</a></h1>
			<p>{$group.description}</p>
			<button on:click={ addChild }>Add Child</button>
		</header>
	{/if}
	<nav>
		{#if $group.children.length > 0 }
			{#each $group.children as child, i}
				<svelte:self
					node={child}
				/>
			{/each}
		{/if}
	</nav>
</article>
{/if}