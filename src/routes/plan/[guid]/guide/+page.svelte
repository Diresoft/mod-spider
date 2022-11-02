<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PushBreadcrumb href="./guide" text="Guide" icon="auto_awesome" postfix_icon/>

<h1>Guide for {data.plan.guid}</h1>