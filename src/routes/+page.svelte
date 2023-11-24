<script lang="ts">
    import { global_db } from "$lib/database/db";
    import { liveQuery } from "dexie";
    import { pushModal } from "./components/Modal/Modal.svelte";
    import AddGameType from "./components/Modal/AddGameType.svelte";
    import { writable, type Writable } from "svelte/store";
    import { onMount, type SvelteComponent } from "svelte";
    import { blur } from "svelte/transition";
    import { circInOut, cubicInOut, sineInOut } from "svelte/easing";
    import YesNoModal from "./components/Modal/YesNoModal.svelte";

    // INTERNAL
    type QuoteItem = { quote: string, icon?: typeof SvelteComponent };
    const quotes: QuoteItem[] = [ // Thanks ChatGPT!
        {
            quote: "A world of endless possibility at your fingers",
            icon: IconCarbonEarth
        },
        {
            quote: "At the touch of your fingertips, turn pixels into a playground of endless possibilities.",
            icon: IconPixelarticonsCloudSun
        },
        {
            quote: "A universe of possibilities is just a click away",
            icon: IconJamUniverse
        },
        {
            quote: "Modding: where the magic of endless possibilities is at your fingertips.",
            icon: IconCarbonMagicWand
        },
        {
            quote: "At your fingertips, the ordinary transforms into a tapestry of limitless possibilities.",
        },
        {
            quote: "Modding is the art of crafting a world of possibilities, all within reach of your fingertips.",
            icon: IconMdiHammerScrewdriver
        },
        {
            quote: "The power to reshape worlds is right at your fingertips.",
            icon: IconCarbonEarth
        },
        {
            quote: "At your command, modding turns a game into a symphony of endless possibilities.",
            icon: IconMdiTrumpet
        },
        {
            quote: "At the tips of your fingers, rewrite the script and unlock a universe of gaming possibilities.",
            icon: IconMdiScriptOutline
        },
        {
            quote: "With each click, modding transforms your gaming world into a realm of limitless possibilities.",
            icon: IconMdiCursorDefaultClick
        },
        {
            quote: "WARNING! Do not look directly at the bugs.",
            icon: IconMdiBug
        },
        {
            quote: "Things will break, don't get too broken up about it.",
            icon: IconMdiHeartBrokenOutline
        },
        {
            quote: "From this moment on, nothing will be the same.",
            icon: IconMdiRocketLaunchOutline
        }
    ]
    let cur_quote_idx: number;
    let cur_quote_item: Writable<QuoteItem> = writable( { quote: "" } );

    // STORES
    let game_count = liveQuery( () => global_db.games.count() );

    // DYNAMIC
    let icon: typeof SvelteComponent = IconCarbonRequestQuote;
    cur_quote_item.subscribe( v => {
        if ( v.icon != icon )
        {
            icon = v?.icon ?? IconCarbonRequestQuote; // Only set the icon if it actually changed so the transition won't play for it
        }
    })
    //$: icon  = $cur_quote_item.icon  ?? IconCarbonRequestQuote;
    $: quote = $cur_quote_item.quote ?? "Things will break. Like I just did. 😈";
    
    // METHODS
    function cycle_quote()
    {
        let idx;
        do {
            idx = Math.floor( Math.random() * quotes.length );
        } while( idx === cur_quote_idx ); // Never pick the same number. Possibly an infinite loop, but probably not!
        cur_quote_idx = idx;

        cur_quote_item.set( quotes[ cur_quote_idx ] );
        setTimeout( cycle_quote, 5000 )
    }

    // LIFECYCLE
    cycle_quote();

</script>
<div>
    <quote>
        {#key icon}
            <icon transition:blur={{duration: 2000, amount: 50, easing: cubicInOut }}>
                <svelte:component this={icon} class='icon' />
            </icon>
        {/key}
        <IconCarbonQuotes class="open-quote" />
        {#key quote}
            <span transition:blur={{duration: 2000, amount: 50, easing: cubicInOut }}>
                {quote}
            </span>
        {/key}
        <IconCarbonQuotes class="close-quote" />
    </quote>

    {#if $game_count > 0}
        <small>Select a game to begin.</small>
    {:else}
        <small>Broaden the horizons of a new game.</small>
        <button on:click={()=>pushModal( AddGameType )}>
            <IconCarbonAdd />
        </button>
    {/if}
</div>

<style lang="scss">
    @use 'sass:color';
    @use '$scss/theme';

    @keyframes bg-scroll {
        0%  { background-position:  0vw   300vw }
        100%{ background-position:  600vw 300vw }
    }

    div {
        position:        relative;
        display:         flex;
        flex-direction:  column;
        align-items:     center;
        justify-content: center;

        background: repeating-linear-gradient( 45deg, rgba(theme.$accent_1, 0.5), rgba(theme.$accent_2, 0.5), rgba(theme.$accent_1, 0.5) 50% );
        background-size: 600vw 600vw;

        animation: bg-scroll 20s linear infinite;

        color: theme.$light, 0.5;

        font-size: 2em;
        text-align: center;

        padding: 1em;

        & > :global( svg ) {
            font-size: 100px;
        }

        header {
            font-size: 1em;
        }
        small {
            margin-top: 1em;
            font-size: 0.75em;
            margin-bottom: 1em;
        }

        button {
            outline:    none;
            background: none;

            color: theme.$light;

            font-size: 2em;

            border: solid 1px theme.$light;
            border-radius: 2em;

            aspect-ratio: 1/1;

            cursor: pointer;

            transition: background-color 250ms ease;
            &:hover {
                background: rgba( theme.$light, 0.25 );
            }
        }
    }
    
    quote {
        position: relative;
        
        width:      100%;
        min-height: 33%;

        display:  grid;
        grid-template-areas:
            '.  icon  .'
            'oq quote cq'
        ;
        grid-template-rows:    0.2fr 0.8fr;
        grid-template-columns: 2em auto 2em;

        align-items:   center;
        justify-items: center;

        icon {
            grid-area: icon;
            font-size: 3em;
        }
        :global(.open-quote) {
            grid-area: oq;
            position: relative;
            top: -25%;
            font-size: 0.75em;
        }
        span {
            position: relative;
            width: 100%;
            grid-area: quote;
            font-family: 'Mirza';
            font-size:   1.2em;
        }
        :global(.close-quote) {
            grid-area: cq;
            position: relative;
            top:  25%;
            font-size: 0.75em;

            transform: scale( -100%, -100% );
        }
    }

</style>