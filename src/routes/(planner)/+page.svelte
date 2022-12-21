<script lang="ts">
	import { goto } from '$app/navigation';
	import PushBreadcrumb from '$lib/components/Breadcrumbs/PushBreadcrumb.svelte';
	import ImageCover from '$lib/components/ImageCover.svelte';
	import { app, SINGLETON_PLAN } from '$lib/modules/app/application_context';
	import type { ModPlan } from '$lib/modules/app/project/ModPlan';
	import { btnAnchor } from '$lib/modules/util/helpers';

	let plans : ModPlan[] = [ SINGLETON_PLAN ];
	const cover_img_src = "covers/logo_white.png"
</script>

<PushBreadcrumb href="/" text="Home"/>

<article class="responsive no-padding absolute center middle border">
	<div class="grid">
		<div class="s3">
			<ImageCover src="covers/skyrim.jpg" />
		</div>
		<recent-plans-container class="s9 padding" >
			<h5>Recent Plans</h5>
			<list>
				{#each plans as plan}
					<div class="row">
						<img class="circle tiny" src={cover_img_src}>
						<div class="max">
							<h6>{plan.descriptor.display_title}</h6>
							<p>{plan.descriptor.description}</p>
						</div>
						<nav class="no-space">
							<button class="border left-round" on:click={ btnAnchor( `/planner/${plan.guid}/details`) }>
								<i>rocket_launch</i> <!-- Next best: <i>arrow_insert</i> -->
								<span>Open</span>
							</button>
							<button class="border right-round">
								<i>delete_forever</i>
								<span>Delete</span>
							</button>
						</nav>
					</div>
				{/each}
			</list>
			<nav class="no-space">
				<button class="border left-round max">
					<i>more_horiz</i>
					<span>Browse</span>
				</button>
				<button class="border right-round max">
					<i>add</i>
					<span>Add</span>
				</button>
			</nav>
		</recent-plans-container>
	</div>
</article>

<style lang='scss'>
// https://www.beercss.com/
recent-plans-container {
	display: flex;
	flex-direction: column;

	& > h5 {
		align-self: center;
	}

	& > list {
		flex-grow: 1;
	}

	& > nav {
		align-self: stretch;
	}
}
</style>