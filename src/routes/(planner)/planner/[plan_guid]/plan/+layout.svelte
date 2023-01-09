<script lang="ts">
	import PushBreadcrumb from '$lib/components/Breadcrumbs/PushBreadcrumb.svelte';
	import { MultiWindowDragBridge } from '$lib/modules/app/MultiWindowDrag';
	
	import { TEMP_MOD_GROUPS } from '$lib/modules/app/application_context';

	import { Rect } from '$lib/modules/math/Rect';
	import { listen, TauriEvent } from '@tauri-apps/api/event';
	import { appWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import ModGroupEntry from '$lib/components/planning/ModGroupEntry.svelte';
	import { writable, type Writable } from 'svelte/store';

	MultiWindowDragBridge.on( 'dragstart', ( e ) => {
		console.log( `${appWindow.label} recieved dragstart with payload`, e );
	})
	
	MultiWindowDragBridge.on( 'drag', ( e ) => {
		if ( e.bIsBlockedBySenderWindow ) return; // Don't try and update movement if it's still over the original window

		console.log( `${appWindow.label} recieved drag with payload`, e );
	})
	MultiWindowDragBridge.on( 'dragend', ( e ) => {
		
		console.log( `${appWindow.label} recieved dragend with payload`, e );
	})


</script>
<PushBreadcrumb href="./plan" text="Plan" icon='rebase_edit' postfix_icon />

<content>
	<article class="groups">
		<!--
			The major mod groups, each group contains multiple mods. This view should be re-arrangeable with drag and drop. 
			The list should be hierarchical, allowing for the creation of subgroups that move with the parent group
		-->
		<ModGroupEntry group={TEMP_MOD_GROUPS} root={true} expanded={true} />
	
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