<script lang="ts">
	import PushBreadcrumb from "$lib/components/Breadcrumbs/PushBreadcrumb.svelte";
	import { btnAnchor } from "$lib/modules/util/helpers";
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<PushBreadcrumb text={data.plan.descriptor.display_title} />

<nav class="tiny-padding">
	<button class="responsive transparent vertical small" on:click={ btnAnchor( `/planner/${data.plan.guid}/details` ) }>
		<i>home</i>
		<span>Details</span>
	</button>
	<button class="responsive transparent vertical small" on:click={ btnAnchor( `/planner/${data.plan.guid}/plan` ) }>
		<i>rebase_edit</i>
		<span>Plan</span>
	</button>
	<button class="responsive transparent vertical small" on:click={ btnAnchor( `/planner/${data.plan.guid}/graph` ) }>
		<i>share</i>
		<span>Graph</span>
	</button>
	<button class="responsive transparent vertical small" on:click={ btnAnchor( `/planner/${data.plan.guid}/guide` ) }>
		<i>auto_awesome</i>
		<span>Guide</span>
	</button>
</nav>
<slot></slot>
<style lang="scss">
	nav {
		display:		flex;
		flex-direction:	column;
	}
</style>