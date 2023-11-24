<script lang='ts'>
    import type { Game } from "$lib/database/objects/Game";
    import { convertFileSrc } from "@tauri-apps/api/tauri";
    import type { Readable } from "svelte/motion";
    import Spinner from "./Spinner.svelte";

    export let game : Game;
    $: title       = (game?.title ?? "").length > 0 ? game.title : "Game Title";
    $: img_api_src =  game?.img_src !== undefined ? convertFileSrc( game.img_src ) : undefined;

</script>

<game-icon class:fallback={img_api_src === undefined}>
    {#if game === undefined}
        <spinner_container><Spinner /></spinner_container>
    {/if}
    {#if img_api_src !== undefined }
        <img src={img_api_src} alt="game's grid icon" />
    {:else}
        <IconCarbonGameConsole/>
        <small>{title}</small>
    {/if}
</game-icon>


<style lang="scss">
    @use 'sass:color';
    @use '$scss/theme';
    
    $light:  color.mix( theme.$light, theme.$accent_1, 60% );
    $accent: theme.$accent_1;
    $dark:   color.mix( theme.$dark,  theme.$accent_1, 60% );

    spinner_container {
        position: absolute;

        display:  flex;
        flex-direction:  row;
        align-items:     center;
        justify-content: center;

        top:    0;
        left:   0;
        right:  0;
        bottom: 0;

        backdrop-filter:  blur( 5px );
        background-color: rgba( theme.$dark, 0.5 );
    }

    game-icon {
        position: relative;
        display:  flex;

        flex-direction:  column;
        align-items:     center;
        justify-content: space-around;

        width:        5em;
        height:       auto;
        aspect-ratio: 1/1.2;

        &.fallback {
            padding: 0.5em;
        }

        // border-radius: 1em;
        overflow:      hidden;

        background: linear-gradient( 45deg, $light, $accent, $dark);

        & >:global( svg ) {
            font-size:  4em;
            flex-basis: 75%;
        }
        small {
            font-weight: bold;
            text-align:  center;
            font-size:  0.5em;
            flex-basis: 25%;
            white-space: pre-wrap;
        }

        img {
            object-fit: cover;
            height: 100%;
            width:  100%;
        }
    }

</style>