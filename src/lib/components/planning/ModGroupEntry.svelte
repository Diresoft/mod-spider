<script lang="ts">
	import type { ModGroup } from "$lib/modules/app/application_context";
	import { SubgroupDragHandler, SubgroupDragState } from "$lib/modules/components/ModGroupEntry";
	import { onMount } from "svelte";
	import { writable, type Writable } from "svelte/store";
	import { slide } from "svelte/transition";

	export let group: ModGroup;
	export let expanded: boolean = false;

	let bCanExpand:	 Writable<boolean>			= writable( false );
	let dragState:	Writable<SubgroupDragState>	= writable( SubgroupDragState.NotStarted );

	onMount( () => {
		bCanExpand.set( group && group.subgroups.length > 0 )
	} )

	function doExpand()
	{
		if ( $bCanExpand )
		{
			expanded = !expanded;
		}
		else
		{
			expanded = false;
		}
	}
</script>

<style lang="scss">
@use '@scss/core/fonts.scss';

header {
	display:		grid;
	grid-template-columns: 1em 2em auto;
	grid-template-rows: auto;
	grid-template-areas:
		'drag icon title'
		'drag icon description'
	;
	align-items:	center;

	cursor:			pointer;
	user-select: 	none;
	
	padding:	0.2em;
	margin:		0.2em;
	background-color: var( --surface-variant );
	border-radius: 1em;

	&.expanded {
		margin-bottom: 0;
	}

	span {
		grid-area: title;

		font-size:		1.5em;
		font-family:	'Nunito';
		font-weight:	lighter;
	}

	i {
		grid-area: icon;
	}

	description {
		grid-area: description;
		
	}

	drag-handle {
		grid-area: drag;

		&::after {
			position:		absolute;

			top:			50%;
			left:			50%;
			transform:		translate( -50%, -50% );

			content:		"drag_indicator";
			font-family:	'Material Symbols Sharp';
			font-size:		1.5em;
		}
	}
}
content {
	display:		flex;
	flex-direction:	column;

	subgroups {
		margin-left:	1em;
	}
}
</style>

<header
	class:expanded
	draggable={!expanded}

	on:click={ doExpand }

	on:dragstart
	on:drag
	on:dragend
	on:dragexit
>
	{#if !expanded}
		<drag-handle />
	{/if}
	{#if $bCanExpand && expanded }
		<i class="material-symbol">folder_open</i>
	{:else if $bCanExpand }
		<i class="material-symbol">folder</i>
	{:else}
		<i class="material-symbol">token</i>
	{/if}
	<span>{group.name}</span>
	<description>{group.description}</description>
</header>
{#if expanded}
<content
	class:expanded
	transition:slide={{duration:300}}
	class:drop-active={ $dragState === SubgroupDragState.Inside }
	on:dragenter = { (e) => SubgroupDragHandler.dragenter( e, dragState ) }
	on:dragover  = { (e) => SubgroupDragHandler.dragover ( e, dragState ) }
	on:dragleave = { (e) => SubgroupDragHandler.dragleave( e, dragState ) }
	on:drop      = { (e) => SubgroupDragHandler.drop     ( e, dragState ) }
>
	<subgroups
	>
		{#each group.subgroups as subgroup}
			{@const handler = new SubgroupDragHandler( subgroup )}
			<svelte:self
				group={subgroup}
				on:dragstart = { (e) => handler.dragstart(e) }
				on:drag      = { (e) => handler.drag     (e) }
				on:dragend   = { (e) => handler.dragend  (e) }
				on:dragexit  = { (e) => handler.dragexit (e) }
			/>
		{/each}
	</subgroups>
</content>
{/if}