<script lang="ts" context="module">
    import type { ChromeInfo } from '$lib/app/Context';
	export let chrome_info: Writable<ChromeInfo> = writable( {
		title: "Mod Spider",
		breadcrumbs: []
	} );
	// TODO: Some way to ensure this maintains a sensible order through reloads?
	</script>
	<script lang='ts'>
	// Import global style libraries
	import 'material-symbols';
	import '$scss/core.scss';
	import '$scss/fonts.scss';

    import Breadcrumb from './Breadcrumb.svelte';
    import { goto } from '$app/navigation';
    import { writable, type Writable } from 'svelte/store';
    import { WebviewWindow } from '@tauri-apps/api/window';
    import ChromeTitlebar from '../ChromeTitlebar.svelte';
	import { invoke } from '@tauri-apps/api/tauri'
    import { ChevronRight, Home, LucideSparkles, Sparkles } from 'lucide-svelte';
	
	function crumbNavigate( uri: string )
	{
		goto( uri );
	}

	async function showModDb( )
	{
		const LABEL = 'MOD_SPIDER_DB_WINDOW';
		let db_win = WebviewWindow.getByLabel( LABEL );
		if ( db_win === null )
		{
			db_win = new WebviewWindow( LABEL, {
				url: "/mod_db",
				transparent: true,
				decorations: false,
				fileDropEnabled: true
			});
			db_win.once('tauri://created', function () {
				invoke( 'set_window_shadow', { windowLabel: LABEL, shadowState: true } );
			});
		}
	}
</script>

<Breadcrumb icon={Home} name="Home" uri="/planner" />
<ChromeTitlebar>
	<crumbs>
		{#each $chrome_info.breadcrumbs as crumb}
			<a href={crumb.uri}><svelte:component this={crumb.iconComponent} class="crumb-icon"/>{crumb.name}</a>
			<ChevronRight class="chevron" />
		{/each}
		<fill />
		<button class="moddb" on:click={ showModDb }><Sparkles /></button>
		<hr />
	</crumbs>
</ChromeTitlebar>
<slot/>

<style lang='scss'>
	@use 'sass:math' as math;

	crumbs {
		position: relative;

		display: flex;
		flex-direction: row;
		align-items: center;

		fill {
			flex-grow: 1;
		}

		a {
			$corner-radius: 10px;
			$caret-width: 1.5em;
			$caret-padding: 0.1em;

			position: relative;

			pointer-events: all;
			color: inherit;
			text-decoration: none;

			padding: 0 math.div( $corner-radius, 2 );

			border: solid 1px var( --titlebar-color );
			border-radius: $corner-radius;

			font-size: 10pt;

			&:hover {
				background-color: var( --titlebar-highlight );
			}

			& > :global( .crumb-icon )
			{
				display: inline-block;
				vertical-align: middle;
				height:  1.25em;
				margin-bottom: 0.15em;
				margin-left: -0.15em;
			}
		}

		& > :global( .chevron:last-of-type )
		{
			display: none;
		}

		.moddb {
			font-size: 14pt;
		}

		$edge-size: 3px;
		button {
			font-family: 'bootstrap-icons';
			background:  none;
			outline:     none;

			color:  inherit;
			border: none;
			
			align-self: stretch;

			margin-top:	   -$edge-size;
			margin-bottom: -$edge-size;

			&:hover {
				background-color: rgba( 255, 240, 240, 0.15 )
			}
			& > :global( .lucide-icon )
			{
				color: var( --titlebar-color );
				height: 1em;
				vertical-align: middle;
			}
		}

		hr {
			border-color: var( --titlebar-color );
			align-self: stretch;
			margin: 2px 3px;
		}
	}
</style>