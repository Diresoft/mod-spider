<script lang="ts">
    import Breadcrumb from "../../../Breadcrumb.svelte";
    import type { PageData } from "./$types";

	export let data: PageData;
	$: plan = data.plan;
	$: group = data.group;
</script>


{#if $group === undefined || $plan === undefined}
...loading
{:else}
<Breadcrumb
	icon="&#xf1f6;"
	name={$group.name}
	uri="/plans/{$plan.id}/{$group.id}"
/>
<article>
	<header>
		Child Selected: {$group?.name}
		<input type='text' bind:value={$group.name}/>
	</header>
</article>
{/if}