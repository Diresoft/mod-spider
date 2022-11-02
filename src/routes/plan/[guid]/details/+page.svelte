<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PushBreadcrumb href="./details" text="Details" icon='home' postfix_icon/>

<main class="responsive">
	<div class="field label border round">
		<input type="text">
		<label>Label</label>
	</div>
</main>

<style lang="scss">

	input:focus,
	input:not(:empty)
	{
		background: green;
	}
</style>