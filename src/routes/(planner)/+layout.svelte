<script lang="ts">
	import 'beercss';
	import '$lib/beercss/theme-override.scss';

	import 'material-symbols';

	import { btnAnchor } from '$lib/modules/util/helpers';
	import { app } from '$lib/modules/app/application_context';	
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { ModPlan } from '$lib/modules/app/project/ModPlan';

	import { listen } from '@tauri-apps/api/event'
	import { invoke } from '@tauri-apps/api/tauri'

	import { WebviewWindow } from "@tauri-apps/api/window";
	import { TEMP_ALL_MODS } from "$lib/modules/app/application_context";


	listen('tauri://file-drop', event => {
		console.log('tauri://file-drop', event)
	})

	function OpenConstellation() {
		// Spawns the window. Doesn't need to do much more here
		new WebviewWindow( "constellation", {
			url:			"/constellation/",
			alwaysOnTop:	true,
			decorations:	false,
			transparent:	true,
			height:			500,
			width:			800
		});
	}


	function test()
	{
		invoke( 'open_docs' );
	}

</script>

<header>
	<nav>
		<h5 class="max left-align">
			<Breadcrumbs />
		</h5>
		{#if $page.data.plan instanceof ModPlan}
		<nav class="no-space">
			<button class="border left-round small primary-border primary-text" on:click={ () => test() }>
				<i>save</i>
				<div class="tooltip bottom">Save</div>
			</button>
			<button class="border no-round small">
				<i>save_as</i>
				<div class="tooltip bottom">Save As</div>
			</button>
			<button class="border right-round small error-border error-text" on:click={ btnAnchor('/') }>
				<i>close</i>
				<div class="tooltip bottom">Close Plan</div>
			</button>
		</nav>
		{/if}
		<nav class="no-space">
			<button class="border left-round small" on:click={ () => OpenConstellation() }>
				<i>browse_activity</i><!-- <i>magic_button</i> -->
				<div class="tooltip bottom">Mod Database Browser</div>
			</button>
			<button class="border right-round small">
				<i>settings</i>
				<div class="tooltip bottom">Settings</div>
			</button>
		</nav>
	</nav>
</header>
<content>
	<slot></slot>
</content>

<style lang="scss">

// This is the root style sheet for this section of the app, so use a global target to re-style the Svelte created div to what I want
:global(body > div){

	// Absolutely ensure we don't scroll or escape the base frame
	height:		100vh;
	width:		100vw;
	overflow:	hidden;

	display:		flex;
	flex-direction:	column;

	position:		relative;
}
content {
	position:		relative;
	flex-grow:		1;

	height:			100%;
	display:		flex;
	flex-direction:	row;
}
app-menu {
	position: fixed;
}
</style>