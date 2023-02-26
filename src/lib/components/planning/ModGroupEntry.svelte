<script lang="ts" context="module">
	export let source:			Writable<ModGroup> | null	= null;
	export let source_parent:	Writable<ModGroup> | null	= null;
	export let own_dropzones:	Array<HTMLElement> | null	= null;
</script>
<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { quintOut } from "svelte/easing";
	import { slide } from "svelte/transition";
	import { get, writable, type Writable } from "svelte/store";
    import type { ModGroup } from "$lib/modules/app/project/ModGroup";
    import { GenericPersistedStore } from "$lib/modules/util/PersistedStore";
    import type { Guid } from "$lib/modules/util/Guid";

	enum DropPosition {
		None,
		Inside,
		After
	}

	export let group:		ModGroup;
	export let parent:		GenericPersistedStore<Guid,ModGroup>|undefined;
	export let expanded:	boolean = false; // Initial state


	const dispatch = createEventDispatcher();
	const hoverDropPosition: Writable<DropPosition>	= writable( DropPosition.None );

	let wrapped_group:	 GenericPersistedStore<Guid, ModGroup> = new GenericPersistedStore( group.guid, group );
	let curHoverTarget:  HTMLElement|null	= null;
	let expandable:		 boolean			= false;
	let subgroups:		 ModGroup[]			= [];
	let subgroup_length: number				= Number.MAX_VALUE;

	wrapped_group.subscribe( (v: ModGroup) => {
		console.log( `asdf`, v );
		subgroups = v.subgroups;

		const didGrow = subgroups.length > subgroup_length;
		subgroup_length = subgroups.length;

		expandable	= subgroup_length > 0;
		expanded	= (expanded || didGrow ) && expandable;
	});

	function doExpand()
	{
		if ( subgroups.length > 0 )
		{
			expanded = !expanded;
		}
	}

	function doSelectGroup()
	{
		dispatch("selectGroup", { group: wrapped_group } );
	}
	
	function getDropTarget( e: DragEvent ): HTMLElement | false
	{
		const target: HTMLElement | null = e.target as HTMLElement | null;
		if ( target === null )					return false;
		if (
				target.tagName !== "DROPZONE-AFTER"
			&&	target.tagName !== "DROPZONE-INSIDE"
		)	return false;
		if( own_dropzones?.includes( target ) ) return false;
		
		return target;
	}

	function dragover( e: DragEvent )
	{
		const target = getDropTarget( e );
		if ( !target ) return;
		e.preventDefault();
	}

	function dragstart( source_group: Writable<ModGroup>, e: DragEvent )
	{
		source			= source_group;
		source_parent	= parent ?? null;
		own_dropzones	= Array.from( (e.target as HTMLElement|null)?.querySelectorAll( 'dropzone-after, dropzone-inside' ) ?? [] );
		e.dataTransfer?.setData("diresoft/guid", get(source_group).guid.toString() );
		dispatch( "dragstart" );
	}

	function dragenter( position_target: DropPosition, e: DragEvent )
	{
		const target = getDropTarget( e );
		if ( !target ) return;

		curHoverTarget = target;
		hoverDropPosition.set( position_target );
	}

	function dragleave( e: DragEvent )
	{
		const target = getDropTarget( e );
		if ( !target ) return;

		if ( target === curHoverTarget )
		{
			// We hadn't entered a new target since leaving this event's target, therefore there is no
			// new target, nor a new drop position. Set both to none/null
			hoverDropPosition.set( DropPosition.None );
			curHoverTarget = null;
		}
		// If the current hover target isn't the one we're leaving, then don't change it as entering
		// the target configured all the required state for the new target already
	}

	function dropInside( target: Writable<ModGroup>, e: DragEvent )
	{
		e.preventDefault();
		hoverDropPosition.set( DropPosition.None );
		dispatch( 'dropInside', { source, target, source_parent } );
		
		// Reset
		source			= null;
		source_parent	= null;
		dispatch( "dragstop" );
	}

	function dropAfter( target: Writable<ModGroup>, e: DragEvent )
	{
		e.preventDefault();
		hoverDropPosition.set( DropPosition.None );
		const target_parent: Writable<ModGroup>|undefined = parent;
		dispatch( 'dropAfter', { source, target, source_parent, target_parent } );

		// Reset
		source			= null;
		source_parent	= null;
		dispatch( "dragstop" );
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

	$dropzone-split-point: 35%;
	$inside-left-offset: 15%;
	dropzone-inside {
		//background: rgba( 255, 0, 0, 0.5 );

		position: absolute;
		z-index: 1;

		left:	0;
		right:	0;
		top:	0;
		bottom:	0;//100 - $dropzone-split-point;
	}

	dropzone-after
	{
		//background: rgba( 0, 255, 0, 0.5 );

		position: absolute;
		z-index: 2;

		top:	$dropzone-split-point;
		bottom:	-0.5 * $gap;
		
		left:	$inside-left-offset;
		right:	0;
	}

	// Visualization for hovering a drag-and-drop action

	// - Vars
	$transition-details:	150ms ease-in;
	$icon-size:				3em;
	$height:				5em;
	$padding:				0.5em;

	transition: margin $transition-details;
	drop-visualizer
	{
		&::before {
			content:		"";
			font-family:	'Material Symbols Outlined';
			font-size:		$icon-size;
			height:			0;
			overflow:		hidden;

			transition: height $transition-details;
		}

		position:	absolute;
		height:		0;
		right:		0;

		border: dashed 3px transparent;
		border-radius: 10px;

		transition: height $transition-details;
	}
	
	&.hover-inside,
	&.hover-after {
		margin-bottom: $height;

		drop-visualizer {
			&::before {
				height:	 $icon-size;
			}

			height:	$height - (2 * $padding);
			top:	calc( 100% + $padding );

			border-color: var(--on-surface );
		}
	}

	&.hover-inside drop-visualizer {
		&::before {
			content: "subdirectory_arrow_right";
			
			position:	absolute;
			left:		-(1em + (0.5 * $padding));
		}

		left:	$icon-size + $padding;
	}

	&.hover-after drop-visualizer::before
	{
		content: "move_down";
	}
	&.hover-after drop-visualizer {
		&::before {
			content: "move_down";
			
			position:	absolute;
			left:		50%;
			transform: translateX(-50%);
		}

		left:	0;
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
	class:expandable
	class:expanded
	class:hover-inside ={ $hoverDropPosition === DropPosition.Inside }
	class:hover-after  ={ $hoverDropPosition === DropPosition.After  }
	on:click={ () => {
		doExpand();
		doSelectGroup();
	} }

	draggable		= {!expanded}
	on:dragstart	= { dragstart.bind( undefined, wrapped_group ) }
	on:dragend		= { () => dispatch('dragstop') }
>
	<drop-visualizer/>
	<dropzone-inside
		on:dragenter	= {dragenter.bind( undefined, DropPosition.Inside )}
		on:dragleave	= {dragleave}
		on:dragover		= {dragover}

		on:drop			= {dropInside.bind( undefined, wrapped_group ) }
	/>
	<name>{$wrapped_group.name}</name>
	<description>{$wrapped_group.description}</description>
	{#if !expanded }
		<dropzone-after
			on:dragenter	= {dragenter.bind( undefined, DropPosition.After )}
			on:dragleave	= {dragleave}
			on:dragover		= {dragover}
	
			on:drop			= {dropAfter.bind( undefined, wrapped_group ) }
		/>
	{/if}
</info>
{#if expandable }
	<group>
		{#if expanded }
			<div
				transition:slide={{duration: 300, easing:quintOut}}
			>
				{ #each subgroups as subgroup (subgroup.guid) }
					<svelte:self
						group	= {subgroup}
						parent	= {wrapped_group}
						on:dropInside
						on:dropAfter
						on:dragstart
						on:dragstop	
						on:selectGroup
					/>
				{/each}
			</div>
		{/if}
	</group>
{/if}