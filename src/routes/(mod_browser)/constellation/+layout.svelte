<script lang="ts">
	import 'beercss';
	import '$lib/beercss/theme-override.scss';
	import 'material-symbols';
	
	import PushBreadcrumb from '$lib/components/Breadcrumbs/PushBreadcrumb.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
	import { appWindow, WebviewWindow } from '@tauri-apps/api/window';
	import { writable, type Writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { CTX_SEARCH_STRING } from '$lib/modules/app/constellation_context';

	let search_string : Writable< string | null > = writable( null );
	setContext( CTX_SEARCH_STRING, search_string );

	function close()
	{
		appWindow.close();
	}

</script>

<PushBreadcrumb text="" icon="browse_activity" />

<titlebar>
	<title><Breadcrumbs break_style /></title>
	<expand data-tauri-drag-region />
	<actions>
		<search>
			<input type="text" placeholder="Search" bind:value={$search_string} />
			<i>search</i>
		</search>
		<i class='material-symbol' on:click={close}>close</i>
	</actions>
</titlebar>
<content><slot></slot></content>


<style lang="scss">
	@use 'sass:color';

	search {
		background-color: var( --background );
		padding: 0.25em;

		border-radius: 1em;
		margin-right: 0.25em;

		input {
			background-color: transparent;

			padding: 0 0.5em;

			border: none;
			outline: none;
		}

		i {
			font-size: 1.25em;
		}
	}

	:global( body )
	{
		background-color: transparent;
	}

	:global(body > div)
	{
		height:			100vh;
		width:			100vw;
		overflow:		hidden;

		border:			solid var( --chrome-border ) 1px;
		border-radius:	5px;
		background-color: var( --background );

		display: flex;
		flex-direction: column;
	}

	:global( title > div > a )
	{
		border: 0;
		border-radius: 0;
	}

	:global( titlebar > title > div )
	{
		padding: 0.2em;
		padding-left: 0.5em;
	}

	titlebar {
		display: flex;
		flex-direction: row;
		align-items: stretch;

		background-color: var( --chrome-border );
		border-radius: 0;

		& > title {
			display: inline-block;
			align-self: center;
		}

		& > expand {
			flex-grow: 1;
		}

		& > actions {
			display: inline-block;

			& > i {
				display: inline-block;
				cursor: pointer;
				user-select: none;

				padding: 0.1em;

				background-color: var( --error-container );
			}
		}
	}


</style>