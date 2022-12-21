<script lang="ts">
	export let src : string;
	export let alt : string = "not important";
</script>
<div>
	<img src={src} alt={alt} />
</div>

<style lang="scss">
	div {
		position: relative;
		overflow: hidden;
		height: 100%;

		img {
			position:	absolute;
			min-width:	100%;
			min-height:	100%;
			top:		50%;
			transform:	translateY( -50% );
			transition: 
				  transform	1000ms	ease-in-out
				, width		1000ms	ease-in-out
			;
		}
		// &:hover > img {
		// 	$zoom-amount: 5%;
		// 	width: 100% + $zoom-amount;
		// 	transform: translate( $zoom-amount * -0.5, -25% );
		// }
	}
</style>