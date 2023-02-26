<script lang="ts" context="module">
	export let selected_group: Writable<ModGroup> | null = null;
</script>
<script lang="ts">
	import { goto } from '$app/navigation';
	import PushBreadcrumb from '$lib/components/Breadcrumbs/PushBreadcrumb.svelte';
	import ModGroupEntry, { source, source_parent } from '$lib/components/planning/ModGroupEntry.svelte';
	import { ModGroup } from '$lib/modules/app/project/ModGroup';
    import { GenericPersistedStore } from '$lib/modules/util/PersistedStore';
	import { get, writable, type Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let wrapped_root = new GenericPersistedStore( data.plan.guid, data.plan.groups );
	const bIsDragging = writable( false );
	const bIsHoveringRemove = writable( false );

	type GroupDropEvent = CustomEvent<{
		source:			Writable<ModGroup>,
		target:			Writable<ModGroup>,
		source_parent:	Writable<ModGroup>,
		target_parent:	Writable<ModGroup>
	}>;
	function onGroupDroppedInside( event: GroupDropEvent )
	{
		const { source, target, source_parent } = event.detail;

		//  The store's `get` feature is expensive, but this is not a hot path
		const source_group = get( source );
		const target_group = get( target );

		if ( source_parent !== undefined )
		{
			source_parent.update( ( p ) => {
				// Remove the source from it's parent
				p.subgroups = p.subgroups.filter( v => v !== source_group );
				return p;
			})
		}
		source.update( ( s ) => {
			s.parent = target_group; // Make the target group the source group's parent
			return s;
		});

		target.update( ( t ) => {
			t.subgroups.unshift( source_group ); // Insert dragged group at the front of the subgroups (visualization indicates that's where it'll end up)
			return t;
		});
	}

	function onGroupDroppedAfter( event: GroupDropEvent )
	{
		const { source, target, source_parent, target_parent } = event.detail
		const source_group			= get( source );
		const target_group			= get( target );
		const target_parent_group	= get( target_parent );

		// Update the parents
		if ( source_parent !== undefined )
		{	// Source group is no longer in it's parent, so remove
			source_parent.update( ( sp ) => { 
				sp.subgroups = sp.subgroups.filter( (v) => v !== source_group );
				return sp;
			});
		}
		if ( target_parent !== undefined )
		{	// Source is now in the target's parent group, but I can't just insert. It is specifically _after_ target
			target_parent.update( ( tp ) => {
				const idx_before = tp.subgroups.indexOf( target_group );
				if ( idx_before < 0 ) throw new Error( `When moving ${source_group.name} after ${target_group.name}, ${target_group.name} could not be found in it's parent group: ${target_parent_group.name}` );
				tp.subgroups.splice( idx_before + 1, 0, source_group );
				return tp;
			});
		}

		// Update the target group to have the new parent
		target.update( ( t ) => {
			t.parent = target_parent_group;
			return t;
		})
	}

	let subgroups: ModGroup[] = [];
	wrapped_root.subscribe( (v: ModGroup) => {
		subgroups = v.subgroups;
	})
	
	function onModDroppedOnRemove ( e: DragEvent ) {
		if ( source === null || source_parent === null ) 
		{
			console.warn( `Trying to remove a mod group, but dragging source or it's parent was null` );
			return;
		}

		const s = get(source);
		source_parent.update( p => {
			p.subgroups = p.subgroups.filter( v => v !== s )
			return p;
		} );

		bIsDragging.set( false );
		bIsHoveringRemove.set( false );
	}

	function onAddGroup () {
		wrapped_root.update( g => {
			g.subgroups.push( new ModGroup( "New Group", "" ) );
			return g;
		} )
	}

	function selectGroup ( e: CustomEvent<{ group: Writable<ModGroup> }> )
	{
		console.log( `Set group selection to`, e.detail.group );
		selected_group = e.detail.group;
		const group = get( selected_group );
		goto( `plan/${group.guid}` );
	}

</script>
<PushBreadcrumb href="./plan" text="Plan" icon='rebase_edit' postfix_icon />

<content>
	<article class="groups">
		<group-container>
			<!--
				The major mod groups, each group contains multiple mods. This view should be re-arrangeable with drag and drop. 
				The list should be hierarchical, allowing for the creation of subgroups that move with the parent group
			-->
			{#each subgroups as group ( group.guid ) }
				<ModGroupEntry
					parent={wrapped_root}
					group={group}
					expanded
					on:dropInside	= { onGroupDroppedInside }
					on:dropAfter	= { onGroupDroppedAfter  }
					on:dragstart	= { () => bIsDragging.set( true  ) }
					on:dragstop		= { () => bIsDragging.set( false ) }
					on:selectGroup	= { selectGroup }
				/>
			{/each}
		</group-container>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<add_remove_action
			class:remove-action		= { $bIsDragging }
			class:action-hovered	= { $bIsHoveringRemove }

			on:click		={ onAddGroup }

			on:dragenter	={ ()=>bIsHoveringRemove.set( true  ) }
			on:dragleave	={ ()=>bIsHoveringRemove.set( false ) }
			on:dragover		={ ( e ) => e.preventDefault()		  }
			on:drop			={ onModDroppedOnRemove  }
		/>
	</article>

	<article class="detail">
		<!--
			Shows detail about the selected mod group. Lists mods found in that group and provides a section to add new mods
			The mod list in the detail view should also indicate requirements, although they should be manually removable is the user decides
			This view should also indicate when a mod is in another group
	
		-->
		<slot></slot>
	</article>
</content>

<style lang="scss">
	content
	{
		position:		relative;
		display:		flex;

		flex-grow:		1;
		flex-direction:	row;

		& > article {
			display:		inline-block;
			
			padding:		0;
			margin:			0;
			border-radius:	0;
		}

		.groups {
			display:	flex;
			flex-direction: column;
			width:		15vw;

			padding: 1em;
		}

		.detail {
			flex-grow: 1;
		}
	}
	group-container {
		display:	block;
		overflow-y:	auto;

		flex-grow: 1;
	}

	add_remove_action {
		display: block;

		width: 100%;
		height: 4em;
		
		border: solid 3px var(--on-surface);
		border-radius: 1em;

		cursor: pointer;

		transition:
			  background-color ease-in-out 100ms
			, color ease-in-out 100ms
		;

		&:hover ,
		&.action-hovered {
			background-color: var( --on-surface );
			color: var( --surface );
		}
		
		&::before {
			content: "add";

			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate( -50%, -50% );

			font-size: 3em;
			font-family: "Material Symbols Sharp"
		}

		&.remove-action {
			
			border: dashed 3px var(--on-surface);
			border-radius: 1em;
			
			&::before {
				content: "delete"
			}
		}
	}
</style>