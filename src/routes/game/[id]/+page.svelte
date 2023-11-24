<script lang='ts'>
    import GameIcon from "../../components/Element/GameIcon.svelte";
    import type { PageData } from "./$types";
    
    export let data: PageData;
    $: game = data?.game_store;
</script>

<article>
    <section class="game-info">
        <header>
            <icon>
                <GameIcon game={$game} />
            </icon>
            <h1>{$game?.title}</h1>
        </header>
    </section>
    <hr />
    <section class="game-plans">
        <header>PLANS</header>
    </section>
</article>

<style lang='scss'>
    header {
        font-size: 2em;
    }
</style>