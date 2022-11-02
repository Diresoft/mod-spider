<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PushBreadcrumb href="./graph" text="Graph" icon="share" postfix_icon/>

<h1>Graph for {data.plan.guid}</h1>