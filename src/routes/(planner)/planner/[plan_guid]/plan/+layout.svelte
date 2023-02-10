<script lang="ts">
	import PushBreadcrumb from '$lib/components/Breadcrumbs/PushBreadcrumb.svelte';
	import ModGroupEntry from '$lib/components/planning/ModGroupEntry.svelte';

	import { ModGroup, TEMP_MOD_GROUPS } from '$lib/modules/app/application_context';
	import { get, writable, type Writable } from 'svelte/store';

	let wrapped_root = writable(TEMP_MOD_GROUPS);

	type GroupDropEvent = CustomEvent<{ source: Writable<ModGroup>, target: Writable<ModGroup>, source_parent?: Writable<ModGroup>, target_parent?: Writable<ModGroup> }>;
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
		const { source, target, source_parent, target_parent } = event.detail;


		const source_group = get( source );
		const target_group = get( target );
		
		const source_parent_group = get( source_parent ?? writable(new ModGroup( "No Source Parent", "" ) ) );
		const target_parent_group = get( target_parent ?? writable(new ModGroup( "No Target Parent", "" ) ) );

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
	
</script>
<PushBreadcrumb href="./plan" text="Plan" icon='rebase_edit' postfix_icon />

<content>
	<article class="groups">
		<!--
			The major mod groups, each group contains multiple mods. This view should be re-arrangeable with drag and drop. 
			The list should be hierarchical, allowing for the creation of subgroups that move with the parent group
		-->
		{#each subgroups as group ( group.guid ) }
			<ModGroupEntry group={group} expanded on:dropInside={onGroupDroppedInside} on:dropAfter={onGroupDroppedAfter} parent={wrapped_root}/>
		{/each}
	
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

		border: solid 1px red;

		& > article {
			display:		inline-block;
			
			padding:		0;
			margin:			0;
			border-radius:	0;
		}

		.groups {
			overflow-y: auto;
			width: 15vw;
		}

		.detail {
			flex-grow: 1;
		}
	}
</style>