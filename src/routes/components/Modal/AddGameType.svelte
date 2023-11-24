<script lang='ts'>
    import type { Game } from "$lib/database/objects/Game";
    import Spinner from "../Element/Spinner.svelte";
    import { writable, type Writable } from "svelte/store";
    import { openToTempFile } from "$lib/tauri/fsHelpers";
    import { fade } from "svelte/transition";
    import { appDataDir, dirname, extname, join } from "@tauri-apps/api/path";
    import { BaseDirectory, createDir, removeFile, renameFile } from "@tauri-apps/api/fs";
    import { onDestroy } from "svelte";
    import { global_db } from "$lib/database/db";
    import GameIcon from "../Element/GameIcon.svelte";
    import { SpinnerHandle } from "$lib/svelte/helpers/SpinnerHandle";

    // Modal Interface
    export let dismiss: () => void;

    // Internal
    let temp_img_src   : string | undefined;
    let spinner_handle : SpinnerHandle  = new SpinnerHandle();
    let game           : Writable<Game> = writable( {
        // title: "Game",
        // img_src: "placeholder/game_icon_placeholder.png"
    } as Game );

    // Dynamic
    $: bShowFallback = !$game.img_src || ($game.img_src?.length ?? "") < 1;

    async function write_game() {
        const frozen = $game;
        if ( frozen.title   === undefined || frozen.title.length < 1 ) throw new Error( `Title undefined or empty` );

        // Create a record for this game as we'll need the ID to move the image
        frozen.id = await global_db.games.put( frozen );
        if ( frozen.id === undefined ) throw new Error( `Game had undefined ID after being added to database` );

        // Move the image to the game folder
        if( frozen.img_src )
        {
            const target_path = await join( await appDataDir(), 'games', frozen.id.toString(), `icon.${await extname( frozen.img_src )}` );
            await createDir( await dirname( target_path ), { recursive: true, dir: BaseDirectory.AppData } );
            await renameFile( frozen.img_src, target_path, { dir: BaseDirectory.AppData } );
            frozen.img_src = target_path;
            temp_img_src   = undefined; // No longer a temp image
        }

        // Update the record in the database
        await global_db.games.update( frozen, { img_src: frozen.img_src } );
    }

    async function delete_image() {
        if( temp_img_src ) {
            await removeFile( temp_img_src, { dir: BaseDirectory.AppData } );
            temp_img_src = undefined;
        }
    }
    async function revert_changes() {
        await delete_image();
    }

    function onCancel() {
        spinner_handle.waitFor( revert_changes() );
        dismiss();
    }

    async function onEditImage() {
        const img_path = temp_img_src = await spinner_handle.waitFor( openToTempFile( await join( `pending`, crypto.randomUUID() ), [
            {
                name: 'Image',
                extensions: [ 'png', 'jpeg', 'gif', 'webp' ]
            }
        ]));
        if ( img_path === false ) return; // User didn't select a file

        if( $game.img_src ) {
            // Delete the old image
            await removeFile( $game.img_src, { dir: BaseDirectory.AppData } );
        }
        $game.img_src = img_path;
    }

    async function onSave() {
        await spinner_handle.waitFor( write_game() );
        dismiss();
    }

    onDestroy(() => {
        revert_changes();
    })
</script>

<article>
    {#if $spinner_handle.running}
    <div class='spinner' transition:fade={{duration: 250}}><Spinner bind:handle={spinner_handle} /></div>
    {/if}
    <section>
        <header>Add Game</header>
        <button class='cancel' on:click={ onCancel }>
            <IconCarbonCloseLarge />
        </button>
        <div class='thumbnail'>
            <GameIcon game={$game} />
            <button class='edit' on:click={ onEditImage }>
                <IconCarbonEdit />
            </button>
        </div>
        <textarea class='title' placeholder="Game Title" bind:value={$game.title} />
        <button class='save' on:click={ onSave }>
            <IconCarbonSave />
            <span>Save</span>
        </button>
    </section>
</article>

<style lang='scss'>
    @use 'sass:color';
    @use '$scss/theme';

    article {
        position: relative;

        // background: conic-gradient( from 45deg,
        //     color.scale( theme.$light,    $lightness:  -50% ),
        //     color.scale( theme.$accent_2, $saturation: -30%, $lightness:  -50% ),
        //     color.scale( theme.$dark,     $lightness:    5% ) 180deg,
        //     color.scale( theme.$accent_1, $saturation: -30%, $lightness:  -50% ),
        //     color.scale( theme.$light,    $lightness:  -50% )
        // );
        background-color: color.scale( theme.$accent_1, $saturation: -30%, $lightness:  -70% );
        box-shadow:
            inset  2.5em  2.5em 9em 2em rgba( theme.$accent_1, 0.35),
            inset -2.5em -2.5em 9em 2em rgba( theme.$accent_2, 0.55)
        ;

        aspect-ratio:  2/1;
        padding:       2em;

        .spinner {
            position: absolute;
            z-index:  999;

            display:         flex;
            flex-direction:  row;
            align-items:     center;
            justify-content: center;

            backdrop-filter: blur( 5px );
            background-color: rgba( theme.$dark, 0.5 );

            font-size: 5rem;

            top:    0;
            left:   0;
            right:  0;
            bottom: 0;
        }


        section {
            display: grid;
            grid-template-areas:
                'header header close'
                'icon   title  title'
                'icon   save   save'
            ;
            align-items:     stretch;
            justify-content: stretch;

            gap: 0.5em;

            button {
                cursor:   pointer;

                background: none;
                outline:    none;
                border:     none;

                color:      theme.$light;

                filter: drop-shadow( 0 0 0 transparent );
                transition: filter 150ms ease;
                &:hover {
                    filter: drop-shadow( 0 0 5px theme.$light );
                }
            }

            button.cancel {
                grid-area: close;

                top:   0.33em;
                right: 0.33em;

                font-size: 1.5em;
                margin:    0.5em;

                justify-self: flex-end;
                align-self:   center;
                aspect-ratio: 1/1;

                color: theme.$light;
                border: solid 1px rgba( theme.$light, 0.5 );
                border-radius: 1em;
            }

            header {
                grid-area: header;
                align-self: center;

                text-align: center;

                font-size:   2em;
                font-weight: bold;
            }

            div.thumbnail {
                position: relative;
                grid-area: icon;

                align-self:    center;
                font-size:     2em;
                border-radius: 1rem;
                overflow:      hidden;

                button.edit {
                    position: absolute;
                    top:    0;
                    left:   0;
                    right:  0;
                    bottom: 0;

                    border-radius: 1rem;
                    overflow:      hidden;

                    display:   flex;
                    flex-direction:  column;
                    align-items:     center;
                    justify-content: center;

                    backdrop-filter: blur( 5px ) brightness( 35% );
                    filter:  none;
                    opacity: 0;

                    transition: opacity 250ms ease;
                    &:hover {
                        opacity: 1;
                    }
                }
            }

            textarea.title {
                grid-area: title;

                background: none;
                outline: none;

                border: solid 1px theme.$light;
                border-radius: 1em;
                overflow: hidden;

                color: theme.$light;
                resize: none;

                align-self: stretch;
                text-align: center;

                padding: 0.5em;
            }

            button.save {
                grid-area:    save;

                display:         flex;
                flex-direction:  row;
                align-items:     center;
                justify-content: space-evenly;

                font-size:   1.5em;
                font-weight: lighter;

                border: solid 1px theme.$light;
                border-radius: 0.5em;

                padding: 0.5em 1em;

                & > span {
                    margin-left: 1em;
                }
            }
        }
    }
</style>