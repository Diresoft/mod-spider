<script lang="ts">
	import { fetch, ResponseType } from '@tauri-apps/api/http';
	import { getContext } from "svelte";
	import { CTX_SEARCH_STRING } from "$lib/modules/app/constellation_context";
	import type { Writable } from 'svelte/store';
	import { TEMP_ALL_MODS } from '$lib/modules/app/application_context';
	import { Guid } from '$lib/modules/util/Guid';
	import { NexusModData } from '$lib/modules/mod/Mod';
	import { crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { MultiWindowDragBridge } from '$lib/modules/app/MultiWindowDrag';

	const search_string : Writable< string | null > = getContext( CTX_SEARCH_STRING );

	let search_results = TEMP_ALL_MODS;
	// search_string.subscribe( async ( search ) => {
	// 	search_results = await TEMP_ALL_MODS.filter( ( element ) => {
	// 		return TEMP_MOD_FILTER_FUNCTION( search || '', element );
	// 	} );
	// } );

	const target = "https://www.nexusmods.com/skyrimspecialedition/mods/72772"
	async function test() {
		const response = await fetch( target , {
			method: 'GET',
			responseType: ResponseType.Text
		});
		console.log(response.data);
	}

	let isSelfDragging = false;
	function startModDrag( guid : Guid )
	{
		MultiWindowDragBridge.CreateEvent( { guid } );
		isSelfDragging = true;
	}

	function endModDrag()
	{
		if ( isSelfDragging )
		{
			MultiWindowDragBridge.AbortEvent();
			isSelfDragging = false;
		}
	}

</script>

{#if search_results.length < 1 }
<noresults class="fill">
	<i class="extra">search</i>
	<h5>No results found</h5>
	<p>Add one from a URL</p>
	<expand />
	<nav class="no-space">
		<div class="max field border left-round">
			<input type="text" placeholder="Mod URL" >
		</div>
		<button class="large right-round"><i>add</i></button>
	</nav>
</noresults>
{:else}

<results>
	{#each search_results as mod}
		{#await mod.data}
			<loading>
				<spinner />
				<guid>GUID: {mod.guid}</guid>
			</loading>
		{:then data}
			<mod on:mousedown={ () => startModDrag( mod.guid ) } on:mouseup={ () => endModDrag() }>
				<div class='cover' style="background-image: url('{data.img}')" ></div>
				<info>
					<header>{data.title}</header>
					<p>{data.description}</p>
				</info>
				<extra>
					{#if data instanceof NexusModData}
						<nxid>{data.nexus_id}</nxid>
					{/if}
				</extra>
			</mod>
		{/await}
	{/each}
</results>

{/if}


<style lang="scss">
@use '$scss/core/fonts.scss';

@keyframes spin {
	from {
		transform: rotate( 0deg );
	}
	to {
		transform: rotate( 360deg );
	}
}

:global( content )
{
	position: relative;
	flex-grow: 1;

	overflow-y: auto;
}

results {
	display:			flex;
	flex-direction:		column;
	
	loading {
		position: relative;
		display:			flex;
		flex-direction:		row;
		align-items: 		center;
		justify-content:	center;

		height:				15vh;
		margin:				0.5em;

		background-color:	var(--surface);
		border-radius:		1em;

		spinner {
			position:			relative;

			height:				10vh;
			aspect-ratio:		1/1;

			border: solid 2px transparent;
			border-top-color: var( --primary );
			border-radius: 100%;
			animation: spin 0.5s linear infinite;
		}

		guid {
			margin-left: 5em;
		}
	}

	mod {
		display:			flex;
		position:			relative;
		flex-direction:		row;
		align-items:		center;
		justify-content:	space-between;

		min-height:			15vh;
		margin:				0.5em;

		background-color:	var(--surface);
		border-radius:		1em;

		overflow:			hidden;

		cursor: pointer;
		& > * {
			user-select: none;
		}

		info {
			flex-grow:		1;

			display:		flex;
			flex-direction:	column;

			padding:		0.5em;

			header {
				position:		relative;
				font-size:		1.35em;
				font-family:	Nunito;
				font-weight:	100;
				padding:		0;
			}
			p {
				line-height: 1.2em;
			}
		}

		extra {
			align-self: 		stretch;

			display:			flex;
			flex-direction:		column;
			justify-content:	center;

			padding:		0.5em;
			border-radius:	0;
			

			background-color: var( --surface-variant );

			nxid {
				font-family:	monospace;
				font-style:		italic;
				color: var( --outline );

				text-align: center;
				user-select: text !important;

				&::before {
					content:		"Nexus ID";
					display:		block;
					font-size:		0.75em;
					white-space:	nowrap;
				}
			}
		}

		div {
			display:		inline-block;
			align-self:		stretch;

			flex-shrink:	0;
			border-radius:	0;

			background-position:	center;
			background-size:		cover;

			width:			20vw;
		}
	}
}

noresults
{
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	
	border-radius: 0;
	
	height: 100%;
}


</style>