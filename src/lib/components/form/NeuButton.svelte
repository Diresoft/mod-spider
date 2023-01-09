<!-- <neubutton on:click>
	<slot></slot>
</neubutton>

<style lang='scss'>
@use '$scss/lib/neumorphic';
@use '$scss/theme';

neubutton {
	position:	relative;
	display: inline-block;
	

	margin: 0.5em;
	padding: 0.25em;

	cursor: pointer;
	user-select: none;

	color: theme.$col-text-light;
	
	@include neumorphic.slab( $height: 5px, $corner-radius: 15px, $base-curve: 5px, $lip-curve: 2px );
	@include neumorphic.slab-transition( $duration: 150ms );

	@include neumorphic.slab-lighting( );

	&:hover {
		@include neumorphic.slab-height( $height: 8px );
	}
	
	&:active {
		@include neumorphic.slab-height( $height: -5px );
	}
}
</style> -->