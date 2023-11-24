<script lang="ts">
    import { SelectedGame } from "../../+layout.svelte";
    import type { LayoutData } from "./$types";

    export let data: LayoutData;
    $: game_store = data?.game_store;
    $: {
        if ( $game_store !== undefined && $game_store !== SelectedGame ) {

        }
    }
</script>
<slot />