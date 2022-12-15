<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PushBreadcrumb href="./details" text="Details" icon='home' postfix_icon/>

<main class="responsive">
	<div class="field label border large">
		<input type="text" placeholder=" " value={data.plan.descriptor.display_title}>
		<label>Plan Title</label>
	</div>
	<div class="field label border round small">
		<input type="text" placeholder=" " value={data.plan.descriptor.description}>
		<label>Plan Description</label>
	</div>
</main>

<style lang="scss">
	.field.label.border:not(.fill) > [placeholder]:not(:placeholder-shown) ~ label
	{
		background: var( --body );
		padding: 0 0.5em;
	}
	// input {
	// 	clip-path: polygon(0% 0%, 20rem 0%, 20rem 8rem, 57rem 8rem, 57rem 0%, 100% 0%, 100% 100%, 0% 100%);
	// }
</style>