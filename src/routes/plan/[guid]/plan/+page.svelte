<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<PushBreadcrumb href="./plan" text="Plan" icon='rebase_edit' postfix_icon />

<h1>Plan for {data.plan.guid}</h1>