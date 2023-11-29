<script lang="ts" context="module">
	/** A globally accesible parameter to specify which game has been selected */
	export let SelectedGame: Writable<Game | undefined> = writable( undefined );
	
</script>
<script lang='ts'>
	// Global Styles
	import '$scss/base.scss';

	// Global Fonts
	import '@fontsource/mirza';
	import '@fontsource-variable/montserrat';

	// Page Imports
    import type { Game } from "$lib/database/objects/Game";
    import Modal, { pushModal } from './components/Modal/Modal.svelte';
    import { fade, slide } from 'svelte/transition';
    import AddGameType from './components/Modal/AddGameType.svelte';
    import { global_db, setGame } from '$lib/database/db';
    import { liveQuery } from 'dexie';
    import { goto } from '$app/navigation';
    import { ScreenBlockingSpinner, SpinnerHandle } from '$lib/svelte/helpers/SpinnerHandle';
    import Spinner from './components/Element/Spinner.svelte';
    import GameIcon from './components/Element/GameIcon.svelte';
    import { sleep } from '$lib/util/Utility';
    import { writable, type Writable } from 'svelte/store';

	// Exposed/Global Members
	

	// Internal
	let games = liveQuery( () => {
		return global_db.games.toArray();
	})
	let wide_nav: boolean = false;

	// Dynamic

	async function setSelectedGame( game: Game )
	{
		SelectedGame.set( game );
		await setGame( game );
		await sleep(1000);
		goto( `/game/${game.id}` );
	}

</script>

<article>
	<nav class:wide={wide_nav}>
		<!-- Selected Game -->
		{#key $SelectedGame}
			{#if $SelectedGame !== undefined }
				<span transition:slide={{duration: 250}} class='selected'>
					<icon><GameIcon game={$SelectedGame} /></icon>
					<!-- {#if wide_nav} -->
						<title class:wide={wide_nav}>
							{$SelectedGame.title}
						</title>
					<!-- {/if} -->
				</span>
			{/if}
		{/key}
		<hr/>
		<!-- Game List -->
		{#each $games ?? [] as game}
			{#if game !== $SelectedGame}
				<span transition:slide={{duration: 250}} on:click={() => ScreenBlockingSpinner.waitFor( setSelectedGame( game ) ) }>
					<icon><GameIcon game={game} /></icon>
					<!-- {#if wide_nav} -->
						<title class:wide={wide_nav}>
							{game.title}
						</title>
					<!-- {/if} -->
				</span>
			{/if}
		{/each}

		<!-- Add Game -->
		<button class='add-game' on:click={ () => pushModal( AddGameType ) }>
			<IconCarbonAdd />
			{#if wide_nav}
				<small transition:slide={{duration: 250, axis: 'x'}} >Add Game</small>
			{/if}
		</button>

		<spacer />

		<!-- Expander -->
		<button class="expand" on:click={() => wide_nav = !wide_nav }>
			{#if wide_nav }
				<IconCarbonCaretLeft />
			{:else}
				<IconCarbonCaretRight />
			{/if}
		</button>
	</nav>
	<slot />
	{#if $ScreenBlockingSpinner.running }
		<spinner_container transition:fade={{duration: 250}} class='spinner'>
			<Spinner handle={ScreenBlockingSpinner} />
		</spinner_container>
	{/if}
</article>
<Modal />

<style lang="scss">
	@use "sass:color";
	@use "$scss/theme";


	article {
		position: relative;
		display:  grid;

		height: 100%;

		grid-template-areas:  'nav content';
		grid-template-columns: min-content auto;

		nav {
			position:       relative;
			display:        flex;
			flex-direction: column;
			align-items:    center;
			
			background-image: linear-gradient(
				135deg,
				rgba( color.scale( theme.$accent_1, $lightness:  75%), 0.15),
				rgba(              theme.$accent_1                   , 0.15),
				rgba( color.scale( theme.$accent_1, $lightness: -75%), 0.15)
			);
			border-right: solid 1px theme.$black;
			

			& > span {
				position:        relative;
				display:         flex;
				flex-direction:  row;
				align-items:     center;
				justify-content: space-between;

				padding: 0.25em;

				cursor: pointer;

				icon {
					position: relative;
					display:  block;

					border-radius: 0.5em;

					width: 5em;
					flex-shrink: 0;

					overflow: hidden;
					border: solid 1px transparent;
					transition: border-color 250ms ease;
				}

				& > title {
					position: relative;
					display: block;

					white-space: pre;
					text-align: center;
					overflow: hidden;

					margin-left: 0em;
					width:       0em;
					opacity:     0;
					transition:
						margin-left 250ms ease,
						width       250ms ease,
						opacity     250ms ease
					;
					&.wide {
						margin-left: 0.25em;
						width:       10em;
						opacity:     1;
					}
				}

				transition: background-color 250ms ease;
				&:hover {
					background-color: color.scale( theme.$accent_2, $alpha: -50% );
					icon {
						border-color: white;
					}
				}
			}

			hr {
				align-self: stretch;
				margin:     0.5em 0;
			}

			button {
				border:     none;
				outline:    none;
				background: none;

				display:         flex;
				flex-direction:  row;
				align-items:     center;
				justify-content: center;

				color:     theme.$light;
				font-size: 2em;
				height:    1.5em;

				cursor: pointer;

				aspect-ratio: 1/1;

				border: solid 2px theme.$light;
				border-radius: 0.25em;

				$transition-details: ease 120ms;
				transition:
					background-color $transition-details,
				;

				&:hover {
					background-color: theme.$accent_1;
				}

				small {
					font-size: 0.5em;
					white-space: nowrap;
				}
			}

			&.wide button {
				aspect-ratio: unset;
			}

			button.add-game {
				margin-top: 1em;
			}
			button.expand {
				align-self: stretch;
				border-radius: 0;
				font-size: 1.6em;
			}
		}

		div {
			position: relative;
			display: contents;
		}
		spinner_container {
			display:  flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			z-index: 99999;
			top:    0;
			left:   0;
			right:  0;
			bottom: 0;
			
			font-size: 10em;

			backdrop-filter: blur( 5px );
		}
	}
</style>