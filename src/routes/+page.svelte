<script lang="ts">
	import { app } from '$lib/modules/app/application_context';
	import { ModPlan } from '$lib/modules/app/project/ModPlan';

	let plans : ModPlan[] = [ new ModPlan(), new ModPlan(), new ModPlan(), new ModPlan() ];
</script>


<splash-modal>
	df,mjhaslkdjfhaslk
</splash-modal>



<!-- 
<mod-search-panel>



	<NeuInput bind:value={mod_id} type="text" placeholder="Mod Id" />
	<NeuButton on:click={addMod} >
		<Symbol>add</Symbol>
	</NeuButton>
	<ModSearchComponent search={mod_id} />

</mod-search-panel> -->

<style lang='scss'>
@use '../scss/lib/neumorphic.scss';

splash-modal
{
	display: block;
	position: absolute;

	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);

	padding: 5em;

	@include neumorphic.slab();
}

</style>