<script lang="ts">
	import { quintOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import 'material-symbols';



let bIsFolded: boolean = false;

</script>
<style lang="scss">

.header {

	background-color: red;

	&::before {
		content: "expand_more";
		font-family: 'Material Symbols Rounded';

	}
	
	&.expanded::before {
		content: "expand_less";
	}
}

.content {
	background-color: green;

	&.folded {
		display: none;
	}
}

</style>
<div class="header" class:expanded={ bIsFolded } on:click={ ()=> bIsFolded = !bIsFolded }>
	<slot name="header"></slot>
</div>
{#if !bIsFolded}
	<div
		class="content"
		transition:slide={{duration: 300, easing: quintOut}}
	>
		<slot></slot>
	</div>
{/if}