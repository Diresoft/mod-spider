<script lang='ts'>
    import { onMount } from "svelte";



let timestamp : string = (new Date()).toLocaleString( "en-US" );
function updateTimestamp() {
	timestamp = (new Date()).toLocaleString( "en-US" );
	setTimeout( updateTimestamp, 1000 );
}
onMount(()=>{
	updateTimestamp();
});

</script>
<h1>Hello World!</h1>
<p>The time is: {timestamp}</p>