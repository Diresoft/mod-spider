<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import Chrome, { PopTitle, PushTitle, titleStack } from "./Chrome.svelte";

	export let content: HTMLElement|null = null;

	onMount(() => {
		if ( content !== null )
		{
			PushTitle( content );
		}
	});
	onDestroy(() => {
		if ( content !== null )
		{
			PopTitle( content );
		}
	});
</script>
<style lang='scss'>
	title {
		//display: contents;
		display: block;
		color: var( --titlebar-color );
		font-size: inherit;
	}
</style>
<title bind:this={content}><slot/></title>
