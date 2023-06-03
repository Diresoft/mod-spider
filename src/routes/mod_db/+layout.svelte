<script lang="ts">
    import ChromeTitlebar from "../ChromeTitlebar.svelte";


</script>
<ChromeTitlebar>
	<i>&#xF589;</i> <span>Mod Constellation</span>
</ChromeTitlebar>

<slot />

<style lang="scss">
	
	i {
		font-style: normal;
		font-family: 'bootstrap-icons';
	}
</style>