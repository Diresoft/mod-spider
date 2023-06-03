<script lang="ts">
    import { setContext } from "svelte";
    import type { LayoutData } from "../$types";
    import Breadcrumb from "../../Breadcrumb.svelte";
    import type { ModGroup } from "$lib/app/plan/ModGroup";
	
	export let data: LayoutData;
	$: plan = data.plan;

	function setSelectedGroup( group: ModGroup )
	{
		setContext( "plan:edit:selected-group", group )
	}

</script>

<Breadcrumb
	icon="&#xF4CA;"
	name=Edit
	uri="/plans/{$plan?.id}/edit"
/>

<slot />