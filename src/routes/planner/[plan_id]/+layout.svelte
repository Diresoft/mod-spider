<script lang="ts">
    import { Book } from "lucide-svelte";
    import Breadcrumb from "../Breadcrumb.svelte";
    import type { LayoutData } from "./$types";

	
	export let data: LayoutData;
	$: plan = data.plan;
</script>

<Breadcrumb
	icon={Book}
	name={$plan?.name}
	uri="/planner/{$plan?.id}"
/>

<slot/>