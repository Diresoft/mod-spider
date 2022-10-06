<script lang="ts">
	import IconButton from "$lib/compontents/IconButton.svelte";

</script>

<container>

	<menu>
		<header>
			<title>Plan</title>
			<nav>

			</nav>
		</header>
		<content>

		</content>
	</menu>
	<mod-list>
		<nav>
			<IconButton>add</IconButton>
		</nav>

		Hello World
	</mod-list>
	<hierarchy>
		hierarchy
	</hierarchy>
</container>


<style lang='scss'>
@use '@scss/lib/neumorphic';
@use '@scss/theme' as theme;

container {
	position: relative;
	
	display: flex;
	flex-direction: row;

	height: 100vh;
	width: 100vw;

	overflow: hidden;
}

mod-list {
	position: relative;

	// @include neumorphic.slab( );
	// @include neumorphic.slab-transition( $duration: 550ms, $easing: ease-out );

	width: 25vw;

	padding: 1em;
	margin: 5em;
}

</style>