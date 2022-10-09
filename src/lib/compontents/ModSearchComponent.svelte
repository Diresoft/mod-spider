<script lang="ts">
import { app } from '$lib/app/application_context';
import { afterUpdate, onMount } from 'svelte';

// == Properties ==
export let search : string | null = null;

onMount		( () => { doSearch ( search ); } )
afterUpdate	( () => { doSearch ( search ); } )

async function doSearch( search : string | null ) : Promise<void>
{
	if ( search === null || search.length < 1 ) return; // Don't search for an empty string
}

</script>

<b>{search}</b>