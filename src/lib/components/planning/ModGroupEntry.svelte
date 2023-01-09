<script lang="ts">
	import type { ModGroup } from "$lib/modules/app/application_context";
    import { Guid } from "$lib/modules/util/Guid";
    import { slide } from "svelte/transition";

	// Public Props
	export let group:		ModGroup;
	export let root:		boolean	= false;
	export let expanded:	boolean	= false;

	// Drag Handlers
	
	/**
	 * On Drag Start - Called by the element being dragged
	 * @param e HTML Drag Event data
	 */
	function onDragStart( e: DragEvent )
	{
		// Embed the GUID to move in the transfer data
		e.dataTransfer?.setData( 'diresoft/mod-guid', group.guid.toString() as string );
	}

	/**
	 * On Drag End - Called by the element being dragged
	 * @param source Mod group that's being dragged
	 * @param source_idx Index of the source mod group in it's parent group
	 * @param e HTML Drag Event data
	 */
	function onDragEnd( e: DragEvent )
	{
		document.querySelectorAll('.dragover').forEach( (el) => {
			el.classList.remove( 'dragover' );
		})
		e.stopPropagation();
	}

	/**
	 * On Drag Over - Called by the element which has been dragged over
	 * @param e HTML Drag Event data
	 */
	function onDragOver( e: DragEvent )
	{
		// Indicate we're consuming the drag event
		e.preventDefault();
		return false;
	}

	/**
	 * On Drag Enter - Called by the element the user has dragged something into
	 * @param e HTML Drag Event data
	 */
	function onDragEnter( this: HTMLElement, e: DragEvent )
	{
		if ( !this.parentElement || !this.parentElement.parentElement ) throw Error( `Can't set up drag on element with no parent or grandparent` );

		this.parentElement.parentElement.classList.add('dragover'); // Walk up to the `li` in the targets parent for styling
	}

	/**
	 * On Drag Leave - Called by the element the user has dragged something out of
	 * @param e HTML Drag Event data
	 */
	function onDragLeave( this: HTMLElement, e: DragEvent )
	{
		if ( !this.parentElement || !this.parentElement.parentElement ) throw Error( `Can't set up drag on element with no parent or grandparent` );

		this.parentElement.parentElement.classList.remove('dragover'); // Walk up to the `li` in the targets parent for styling
	}

	/**
	 * On Drop - Called by the element the user let the dragged element go over
	 * @param e HTML Drag Event data
	 */
	function onDrop( e: DragEvent )
	{
		if ( e.dataTransfer )
		{
			

			const guid_to_move: Guid = Guid.From( e.dataTransfer.getData( 'diresoft/mod-guid' ) );
			
		}
	}

</script>

<style lang="scss">
@use '$scss/core/fonts.scss';

$element-padding:	0.5em;
$icon-size:			1.5em;
$icon-padding:		0.5em;
$icon-full-width:	( $icon-size + ( $icon-padding * 2 ) );
$bar-width:			1px;
$bar-padding:		$icon-size * 0.5;

info {
	user-select: none;
	position: relative;

	display: grid;
	grid-template-columns:	$icon-full-width auto;
	grid-template-rows:		auto auto;
	grid-template-areas:
		'icon name'
		'icon description'
	;

	cursor: pointer;

	padding: $element-padding;
	font-family: 'Nunito';

	icon {
		font-family:	'Material Symbols Sharp';
		font-size:		$icon-size;
		grid-area:		icon;
		justify-self:	center;
	}

	name {
		grid-area:		name;
		font-size:		1.25em;
		font-weight:	500;
	}

	description {
		grid-area:		description;
		font-size:		0.9em;
		font-style:		italic;
		font-weight:	light;
	}

	dropzone {
		position: absolute;
		z-index: 1000;

		left: 0;
		top: 0;
		bottom: 0;
		right: 0;
	}
}

ul {
	list-style:		none;

	li {
		position:		relative;
		padding-left:	$icon-full-width * 0.5;

		transition: padding 150ms ease-in-out;

		&::before {
			content: "";
			position:	absolute;
			display:	block;
			top:	0;
			bottom: 0;
			left:	( $icon-padding * 0.5 ) + ( $icon-size * 0.5 );

			width:	$bar-width;
			background-color: var( --on-surface );
		}

		&:last-child::before {
			bottom: inherit;
			height: $icon-size + $element-padding * 0.5;
		}

		&::after {
			content: "";
			position:	absolute;
			display:	block;
			top:	$icon-size + $element-padding * 0.5;
			left:	( $icon-padding * 0.5 ) + ( $icon-size * 0.5 );
			
			width:	( $icon-size * 0.5 ) - ( $icon-padding * 0.5 );
			height: $bar-width;

			background-color: var( --on-surface );
		}
	}
}

:global(li.dragover)
{
	$bg-padding: 0.5em;
	$indicator-height: 2em;

	position:		relative;
	padding-bottom:	2em !important;

	// Highlight
	& > info::before {
		content:	"";
		position:	absolute;

		left:	$bg-padding;
		right:	$bg-padding;
		top:	$bg-padding;
		bottom:	$bg-padding;

		background-color: rgba(255, 255, 255, 0.2);
		border-radius:		0.5em;
	}

	// Place indicator
	& > info::after {
		content:	"";
		position:	absolute;

		left:	$bg-padding;
		right:	$bg-padding;
		bottom:	-$indicator-height;
		height:	$indicator-height - $bg-padding;

		border: dashed 3px grey;
		border-radius: $bg-padding;
	}
}


</style>

{#if root}
<ul>
	{#each group.subgroups as subgroup, idx }
		<svelte:self
			group={subgroup}
		/>
	{/each}
</ul>
{:else}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<info
	on:click={ () => {
		if( group.subgroups.length > 0 )
		{
			expanded = !expanded;
		}
	}}
	draggable		= { !expanded	}
	on:dragstart	= { onDragStart }
	on:dragend		= { onDragEnd	}
>
{#if !expanded}
	<dropzone 
		on:dragenter	= { onDragEnter	}
		on:dragleave	= { onDragLeave	}
		on:drop			= { onDrop		}
		on:dragover		= { onDragOver	}
	/>
{/if}
	<icon>
		{#if group.subgroups.length <= 0}
			token
		{:else if expanded}
			folder_open
		{:else}
			folder
		{/if}
	</icon>
	<name>{group.name}</name>
	<description>{group.description}</description>
</info>

{#if expanded && group.subgroups.length > 0}
<ul
	transition:slide={{duration: 250}}
>
	{#each group.subgroups as subgroup, idx }
		<li><svelte:self group={subgroup} /></li>
	{/each}
</ul>
{/if}


	<!-- <container
		class:root
		class:first_level
		draggable		= { !expanded	}
		on:dragover		= { onDragOver	}
		on:dragenter	= { onDragEnter	}
		on:dragleave	= { onDragLeave	}
		on:drop			= { onDrop		}
		on:click = { ( e ) => {
			expanded = !expanded;
			e.stopPropagation()
		}}
	>
		<info>
			<icon>
				{#if group.subgroups.length <= 0}
					token
				{:else if expanded}
					folder_open
				{:else}
					folder
				{/if}
			</icon>
			<name>{group.name}</name>
			<description>{group.description}</description>
		</info>
		{#if expanded && group.subgroups.length > 0}
			<groups
				transition:slide="{{duration: 300, easing: quintInOut }}"
			>
				{#each group.subgroups as subgroup, idx }
					<svelte:self
						group={subgroup}
						first_level={false}
						on:dragstart={ onDragStart.bind( undefined, subgroup, idx ) }
					/>
				{/each}
			</groups>
		{/if}
	</container> -->
{/if}