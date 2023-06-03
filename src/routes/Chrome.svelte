<script lang="ts" context="module">
    import { get, writable, type Writable } from "svelte/store";
	export let favicon: Writable<string> = writable( "/favicon.png" );
	export let titleStack: Writable< HTMLElement[] > = writable([]);
	export function PushTitle( title: HTMLElement )
	{
		titleStack.update( ( stack: HTMLElement[] ) => {
			stack.unshift( title );
			return stack;
		})
	}
	export function PopTitle( title: HTMLElement )
	{
		titleStack.update( ( stack: HTMLElement[] ) => {
			return stack.filter( v => v !== title );
		})
	}
</script>
<script lang="ts">
	// Import global style libraries
	// import 'material-symbols';
	import '$scss/core.scss';
	import '$scss/fonts.scss';
    import { appWindow } from '@tauri-apps/api/window';
    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';
    import { TauriEvent, listen } from '@tauri-apps/api/event';
    import { LucideMinus, LucideX } from "lucide-svelte";

	export let canMinimize = true;
	export let canMaximize = true;
	export let canClose    = true;

	let DOM_titlebar: HTMLElement|null = null;
	let DOM_actions:  HTMLElement|null = null;
	let titleStackTip: HTMLElement|undefined;
	titleStack.subscribe( refreshTitle );
	function refreshTitle( stack: HTMLElement[] ) 
	{
		const tip = stack[0];
		if ( tip === undefined ) return;

		if( titleStackTip !== undefined )
		{
			titleStackTip.remove(); // Remove the old tip from the titlebar.
		}
		titleStackTip = tip;
		if ( DOM_titlebar !== null && DOM_actions !== null )
		{
			DOM_titlebar.insertBefore( titleStackTip, DOM_actions );
		}
	}

	let blurred:   boolean = false;
	let maximized: boolean = false;

	let tauri_unsubscribers: Function[] = [];

	async function onTauriResize()
	{
		maximized = await appWindow.isMaximized();
	}

	async function onTauriFocusChange( bIsFocused: boolean )
	{
		blurred = !bIsFocused;
	}

	onMount( async () => {
		tauri_unsubscribers.push( await listen( TauriEvent.WINDOW_RESIZED, onTauriResize ) );
		tauri_unsubscribers.push( await listen( TauriEvent.WINDOW_BLUR,    onTauriFocusChange.bind( undefined, false ) ) );
		tauri_unsubscribers.push( await listen( TauriEvent.WINDOW_FOCUS,   onTauriFocusChange.bind( undefined, true  ) ) );

		onTauriResize();
		refreshTitle( get( titleStack ) );
	});
	onDestroy( async () => {
		for( const unsubscriber of tauri_unsubscribers ) unsubscriber();
	})


</script>
<chrome class:blurred class:maximized>
	<titlebar data-tauri-drag-region bind:this={DOM_titlebar}>
		<img src={$favicon} alt="favicon" />
		<actions bind:this={DOM_actions}>
			{#if canMinimize}
				<button on:click={ () => { appWindow.minimize() } }>
					<svg viewBox="0 0 64 64">
						<rect x="0" y="26" width="64" height="6"/>
					</svg>
				</button>
			{/if}
			{#if canMaximize}
				{#if maximized}
					<button on:click={ () => { appWindow.unmaximize() } }>
						<svg viewBox="0 0 64 64">
							<path d="M51.025,51L51.025,64L-0.025,64L-0.025,58L0.025,58L0.025,12.932L13.025,12.932L13.025,-0L64.025,0L64.025,51L51.025,51ZM58.025,45L58.025,6L19.025,6L19.025,12.932L51.025,12.932L51.025,45L58.025,45ZM44.846,19L6.025,19L6.025,58L44.846,58L44.846,19Z"/>
						</svg>
					</button>
				{:else}
					<button on:click={ () => { appWindow.maximize() } }>
						<svg viewBox="0 0 64 64">
							<path d="M64,-0L64,64L0,64L0,-0L64,-0ZM58,6L6,6L6,58L58,58L58,6Z" />
						</svg>
					</button>
				{/if}
			{/if}
			{#if canClose}
				<button on:click={ () => { appWindow.close() } } class="close">
					<svg viewBox="0 0 64 64">
						<path d="M5,0L32,27L59,0L64,5L37,32L64,59L59,64L32,37L5,64L0,59L27,32L0,5L5,0Z"/>
					</svg>
				</button>
			{/if}
		</actions>
	</titlebar>
	<slot name='content'/>
</chrome>
<style lang="scss">
	// Sass libs
	@use 'sass:math'  as math;
	@use 'sass:color' as color;

	// Project libs
	@use '$scss/branding/index.scss' as branding;
	@use '$scss/util/index.scss' as util;

	chrome {
		--border-colour:             #{color.adjust( branding.$primary, $lightness: -10%, $saturation: -10% )};
		--titlebar-background-color: #{branding.$primary};
		--titlebar-color:            #{branding.$light};
		--titlebar-highlight:        #{color.adjust( branding.$light, $alpha: -0.85 )};

		&.blurred {
			//--border-colour:             #{color.adjust( branding.$primary, $lightness: -10%, $saturation: -10% )};
			--titlebar-background-color: #{color.adjust( branding.$primary, $lightness: -5%, $saturation: -5% )};
			--titlebar-color:            #{color.adjust( branding.$light, $lightness: -10%, $saturation: -10% )};
			--titlebar-highlight:        #{color.adjust( branding.$light, $lightness: -10%, $saturation: -10%, $alpha: -0.85 )};
		}

		$corner-radius: 0px;

		&::before {
			// BACKGROUND & FRAME
			content: '';

			position: fixed;
			z-index: -1;
			left:	0;
			right:	0;
			top:	0;
			bottom:	0;

			background-color: branding.$dark;
			//border: solid 1px branding.$primary;
			//border-radius: $corner-radius;
		}

		$edge-size: 3px;
		padding: $edge-size;
		position: relative;

		height: calc( 100vh - ( $edge-size * 2 ) );

		display: grid;
		grid-template-rows: min-content auto;

		titlebar {
			position: relative;

			&::before {
				content: '';
				pointer-events: none;
				display: block;
				position: absolute;
				z-index: -1;
				left:   -$edge-size;
				top:    -$edge-size;
				right:  -$edge-size;
				bottom: 0px;

				//border-top-left-radius:  $corner-radius - 2;
				//border-top-right-radius: $corner-radius - 2;

				background-color: var( --titlebar-background-color );
			}

			pointer-events: all;
			& > * { pointer-events: none };

			color:    branding.$light;
			font-family: 'Inter';
			font-size: 9pt;
			
			padding-left: math.div($corner-radius, 4) ;
			padding-bottom: $edge-size;
			display: grid;
			grid-template-areas:  'favicon title actions';
			grid-template-columns: 0fr auto 0fr;
			grid-template-rows:    min-content;
			align-items: center;
			
			border-bottom: none;

			& > img {
				grid-area:    favicon;
				height:       15pt;
				margin-left:  3pt;
				margin-right: 6pt;
			}

			actions {
				grid-area:  actions;
				display:	flex;
				align-self: stretch;

				& > button {
					background:	none;
					outline:	none;
					border:		none;

					padding:	0px ($edge-size * 3);
					
					margin-top:	   -$edge-size;
					margin-bottom: -$edge-size;

					color: var( --titlebar-color );

					pointer-events: all;
					
					& > svg {
						height: 8pt;
						fill: var( --titlebar-color );
					}

					&:hover {
						background-color: rgba( 255, 240, 240, 0.15 );
					}

					&:hover.close {
						background-color: branding.$windows-close;
					}

					&:last-child {
						//border-top-right-radius: $corner-radius;
						margin-right: -$edge-size;
					}
				}
			}
		}
	}
</style>