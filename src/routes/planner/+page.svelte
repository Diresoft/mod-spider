<script lang='ts'>
    import { goto } from "$app/navigation";
    import { db } from "$lib/Dexie/database";
    import { Plan } from "$lib/app/plan/Plan";
    import type { LayoutData } from "./$types";
    import PlanCard from "./PlanCard.svelte";

	export let data: LayoutData;
	$: plans = data.plans;

	function openPlan( { detail }: CustomEvent<Plan> )
	{
		goto( `planner/${detail.id}` );
	}

	function deletePlan( { detail }: CustomEvent<Plan>  )
	{
		db.plans.delete( detail.id );
	}

	async  function newPlan()
	{
		const newPlan = new Plan( "New Mod Plan", "This is my description! It's pretty long, and includes a linebreak riiiight HERE\nLorem ipsum dolor sit amet consectetur adipisicing elit. Recusandae similique perferendis placeat libero error sunt earum doloribus qui ab. Ducimus consectetur molestias animi, nulla ipsam iusto. Nihil, sit! Eaque, quo." );
		await db.plans.add( newPlan );
		openPlan( { detail: newPlan } as CustomEvent<Plan> );
	}

</script>
<article>
	<section>
		<img src="/covers/skyrim.jpg" alt="" />
		<h1>Mod Plans</h1>
		<button on:click={() => newPlan()}>&#xF64D;</button>
		<ul>
			{#each $plans ?? [] as plan, i}
				<li><PlanCard plan={plan} on:open={openPlan} on:delete={deletePlan}/></li>
			{/each}
		</ul>
	</section>
</article>

<style lang="scss">
	@use '$scss/util/index.scss' as util;
	@use '$scss/branding/index.scss' as branding;

	h1 {
		margin: 0;
		padding: 0;
	}

	article {
		flex-grow: 1;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	section {
		$splash-width: 128px;

		position: relative;
		display: grid;
		grid-template-areas:
		"icon title add"
		"icon list  list"
		;
		grid-template-columns: $splash-width auto min-content;
		grid-template-rows: min-content auto;
		align-items: center;

		gap: 0.5em 0.5em;

		border: solid 1px branding.$primary;
		border-radius: 1em;
		overflow: hidden;

		padding: 0.5em;

		min-width: 60vw;

		margin: 0 5vw;

		h1 {
			grid-area: title;
		}

		button {
			grid-area: add;

			font-family: 'bootstrap-icons';
			@include util.button();
		}

		img {
			grid-area: icon;

			min-height: calc( 100% + 1em );
			min-width: calc( $splash-width + 1em );
			position: absolute;
			
			justify-self: self-end;
		}

		ul {
			grid-area: list;
			list-style: none;
			margin:     0;
			padding: 0;

			li {
				display: contents;
			}
		}
	}
</style>