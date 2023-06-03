<script lang="ts">
    import Chrome from "./Chrome.svelte";
</script>
<Chrome>
	<svelte:fragment slot="content">
		<slot/>
	</svelte:fragment>
</Chrome>