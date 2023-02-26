<script lang="ts">
    import { selected_group } from "../+layout.svelte";


	if ( selected_group === null )
	{
		throw new Error(`Can't show the mod group details page right now since the selection is null`)
	}
</script>

<h1>{$selected_group?.name}</h1>

<style lang="scss">
	
</style>