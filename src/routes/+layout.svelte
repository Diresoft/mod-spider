<script lang="ts" context="module">
	/** A globally accesible parameter to specify which game has been selected */
	export let SelectedGame: Game | undefined;
	
</script>
<script lang='ts'>
	// Global Styles
	import '$scss/base.scss';

	// Global Fonts
	import '@fontsource/mirza';

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
    import { cubicOut } from 'svelte/easing';

	// Exposed/Global Members
	

	// Internal
	let games = liveQuery( () => {
		return global_db.games.toArray();
	})
	let wide_nav: boolean = true;

	// Dynamic

	async function setSelectedGame( game: Game )
	{
		SelectedGame = game;
		await setGame( game );
		goto( `/game/${SelectedGame.id}` );
	}

</script>

<article>
	<nav class:wide={wide_nav}>
		<!-- Selected Game -->
		{#key SelectedGame}
			{#if SelectedGame !== undefined }
				<span transition:slide={{duration: 250}} class='selected'>
					<icon><GameIcon game={SelectedGame} /></icon>
					<!-- {#if wide_nav} -->
						<span>
							{SelectedGame.title}
						</span>
					<!-- {/if} -->
				</span>
			{/if}
		{/key}
		<hr/>
		<!-- Game List -->
		{#each $games ?? [] as game}
			{#if game !== SelectedGame}
				<span transition:slide={{duration: 250}}>
					<icon><GameIcon game={game} /></icon>
					<!-- {#if wide_nav} -->
						<span>
							{game.title}
						</span>
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

				icon {
					position: relative;
					display:  inline-block;

					border: solid 1px red;
					border-radius: 0.5em;

					width: 5em;

					overflow: hidden;
					flex-shrink: 0;
				}
				& > span {
					display: inline-block;

					border: solid 1px green;
					flex-shrink: 1;
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