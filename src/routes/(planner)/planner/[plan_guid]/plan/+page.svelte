<script lang="ts">
	import PushBreadcrumb from '$lib/compontents/Breadcrumbs/PushBreadcrumb.svelte';
	import { MultiWindowDragBridge } from '$lib/modules/app/MultiWindowDrag';
	
	import { Rect } from '$lib/modules/math/Rect';
	import { listen, TauriEvent } from '@tauri-apps/api/event';
	import { appWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';

	MultiWindowDragBridge.on( 'dragstart', ( e ) => {
		console.log( `${appWindow.label} recieved dragstart with payload`, e );
	})
	
	MultiWindowDragBridge.on( 'drag', ( e ) => {
		if ( e.bIsBlockedBySenderWindow ) return; // Don't try and update movement if it's stil over the original window

		console.log( `${appWindow.label} recieved drag with payload`, e );
	})
	MultiWindowDragBridge.on( 'dragend', ( e ) => {
		
		console.log( `${appWindow.label} recieved dragend with payload`, e );
	})

</script>
<PushBreadcrumb href="./plan" text="Plan" icon='rebase_edit' postfix_icon />

<div>
</div>

<style lang="scss">
	div
	{
		background-color: red;
		height: 100%;
		width:  100%;
	}
</style>