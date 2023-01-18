<script lang="ts" context="module">
	export let inFlight: ModGroup | null = null;
	export let inFlightSrcElement: HTMLElement | null = null;
</script>
<script lang="ts">
	import type { ModGroup } from "$lib/modules/app/application_context";
	import { onMount } from "svelte";
	import { quintOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import { writable, type Writable } from "svelte/store";

	export let group: ModGroup;
	export let expanded: boolean = false;
	const isHovered: Writable<boolean>	= writable( false );

	function doExpand()
	{
		if ( group.subgroups.length > 0 )
		{
			expanded = !expanded;
		}
	}

	onMount(()=>{
		expanded = expanded && group.subgroups.length > 0; // Can only be expanded if we have subgroups
	});

	function getTargetIfDropTarget( e: DragEvent ): HTMLElement | false
	{
		const target: HTMLElement | null = e.target as HTMLElement | null;
		if ( target === null )					return false;
		if ( target.dataset.enabled !== 'true')	return false;
		if ( target.tagName !== "DROPZONE" )	return false;
		if ( inFlightSrcElement === target )	return false; // Ignore self

		return target;
	}

	function getParentInfoElement( el: HTMLElement ): HTMLElement | null
	{
		let parent = el.parentElement;
		while( parent !== null && parent.tagName !== "INFO" )
		{
			parent = parent.parentElement;
		}
		return parent;
	}

	function dragover( e: DragEvent )
	{
		const target = getTargetIfDropTarget( e );
		if ( !target ) return;
		e.preventDefault();
	}

	function dragstart( groupBeingDragged: ModGroup, e: DragEvent )
	{
		inFlight = groupBeingDragged;
		const target = e.target as HTMLElement;
		inFlightSrcElement = target.querySelector("dropzone"); // Use the dropzone of the dragged info as the "src"
	}

	function drageenter( e: DragEvent )
	{
		const target = getTargetIfDropTarget( e );
		if ( !target ) {
			return;
		};
		isHovered.set( true );

		// const info = getParentInfoElement( target );
		// if ( !info ) throw new Error( `Couldn't find an <info> element in the parent hierarchy` );
		// info.classList.add( 'drag-hover' );
	}
	function dragleave( e: DragEvent )
	{
		const target = getTargetIfDropTarget( e );
		if ( !target ) {
			return;
		};
		isHovered.set( false );

		// const info = getParentInfoElement( target );
		// if ( !info ) throw new Error( `Couldn't find an <info> element in the parent hierarchy` );
		// info.classList.remove( 'drag-hover' );
	}
	function drop( groupDroppedOn: ModGroup, e: DragEvent )
	{
		e.preventDefault();
		isHovered.set( false );

		console.log( `Move: ${inFlight?.name} after ${groupDroppedOn.name}` );
	}

</script>

<style lang="scss">
$offset:	2em;
$padding:	0.5em;
$icon-size:	1.5em;
$gap:		0.5em;

info {
	display: flex;
	flex-direction: column;

	cursor: pointer;

	padding-left: $offset + $padding;
	margin-top: $gap;

	font-size: 0.9em;

	user-select: none;

	&::before {
		content: 'token';
		position: absolute;

		left: ($offset * 0.5) - ($icon-size * 0.5);
		top: 50%;

		transform: translate(0%, -50%);

		font-family: 'Material Symbols Sharp';
		font-size: $icon-size;

	}
	&.expandable::before {
		content: 'folder';
	}
	&.expanded::before {
		content: 'folder_open';
	}

	name {
		font-size: 1.5em;
	}

	description {
		font-weight: 400;
	}

	dropzone {
		//background: rgba( 255, 0, 0, 0.2 );

		position: absolute;
		z-index: 1;

		left:	0;
		right:	0;
		top:	0;
		bottom:	0;
	}

	$transition-details: 150ms ease-in;
	transition: margin $transition-details;
	&::after
	{
		content: "";
		position: absolute;
		height: 0;

		border: dashed 5px transparent;
		border-radius: 1em;

		transition: height $transition-details;
	}
	&.hovered
	{
		$indicator-height:	4em;
		$padding:			1em;

		margin-bottom: $indicator-height + ($padding * 2);
		background-color: rgba( 255, 255, 255, 0.5);
		&::after
		{
			height: $indicator-height - $padding;
			left:	$padding * 0.5;
			right:	$padding;
			top: calc( 100% + ( $padding ) );

			border: dashed 3px var( --on-surface );
		}
	}
}

group {
	display: block;
	margin-left: $offset;

	&::before {
		content: "";
		position: absolute;

		top:	0px;
		bottom:	0px;
		left:	calc( ($offset * -0.5) + 1px );
		width:	1px;

		bottom: 0.5em;

		background-color: var(--on-surface);
	}
}
</style>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<info
	class:expandable={group.subgroups.length > 0}
	class:expanded
	class:hovered={$isHovered}
	on:click={doExpand}

	draggable		= {!expanded}
	on:dragstart	= { dragstart.bind( undefined, group ) }
>
{#if !expanded }
	<dropzone
		data-enabled	= {!expanded}
		on:dragenter	= {drageenter}
		on:dragleave	= {dragleave}
		on:dragover		= {dragover}

		on:drop			= {drop.bind( undefined, group ) }
	/>
{/if}
	<name>{group.name}</name>
	<description>{group.description}</description>
</info>
<group>
	{#if expanded && group.subgroups.length > 0 }
		<div
			transition:slide={{duration: 300, easing:quintOut}}
		>
			{#each group.subgroups as subgroup}
				<svelte:self group={subgroup} />
			{/each}
		</div>
	{/if}
</group>