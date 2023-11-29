<script lang='ts'>
    import { writable } from "svelte/store";
    import GameIcon from "../../components/Element/GameIcon.svelte";
    import EditContainer from "../../components/Form/EditContainer.svelte";
    import type { PageData } from "./$types";
    
    export let data: PageData;
    $: game = data.game_store;
</script>

<article>
    <section class="game-info">
        <header>
            <icon>
                <EditContainer on:click={() => console.log( "ASDFASDF" ) }>
                    <GameIcon game={$game} />
                </EditContainer>
            </icon>
            <textarea bind:value={$game.title} />
        </header>
    </section>
    <hr />
    <section class="game-plans">
        <header>PLANS for {$game.title}</header>
    </section>
</article>

<style lang='scss'>
    header {
        font-size: 2em;
    }
</style>