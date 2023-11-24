<script lang="ts">
    export let dismiss: ( value: boolean ) => void;
</script>
<article>
    <h1>Question?</h1>
    <nav>
        <button on:click={()=>dismiss( true )}>Yes</button>
        <button on:click={()=>dismiss( false )}>No</button>
        <button>Cancel</button>
    </nav>
</article>