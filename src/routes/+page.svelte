<script lang="ts">
	import { app } from '$lib/app/application_context';
	import Symbol from '$lib/compontents/Symbol.svelte';
	import NeuButton from '$lib/compontents/form/NeuButton.svelte';
	import NeuInput from '$lib/compontents/form/NeuInput.svelte';
	import ModSearchComponent from '$lib/compontents/ModSearchComponent.svelte';

	function addMod()
	{
		console.log("Adding mod")
	}

	let mod_id : any;
</script>

<mod-search-panel>
	<NeuInput bind:value={mod_id} type="text" placeholder="Mod Id" />
	<NeuButton on:click={addMod} >
		<Symbol>add</Symbol>
	</NeuButton>
	<ModSearchComponent search={mod_id} />

</mod-search-panel>

<style lang='scss'>
@use '@scss/lib/neumorphic';
@use '@scss/theme' as theme;

mod-search-panel {
	display: block;
	@include neumorphic.slab();

	margin: 2em;
	padding: 2em;
}

</style>