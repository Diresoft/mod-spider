<script lang="ts">
import { onMount } from "svelte";

// == Properties ==
export const touchReactionDistance : number = 3;

// == Members ==
let el		: HTMLElement | null			= null;
let bounds	: DOMRect						= new DOMRect();
let half_size								= { x: 0, y: 0 };
let largest_size							= 0;
let max_rotation							= 0;
let rot										= { x: 0, y: 0 };
let off										= { x: 0, y: 0 };

onMount( () => {
	bounds			= el?.getBoundingClientRect() ?? bounds;
	half_size		= { x: bounds.width / 2, y: bounds.height / 2 };
	largest_size	= Math.max( bounds.width, bounds.height );
	const theta		= Math.atan( touchReactionDistance / ( bounds.height / 2 ) ); // Required angle to tilt an edge point the desired distance
	const phi		= Math.atan( touchReactionDistance / ( bounds.width  / 2 ) ); // Required angle to tilt an edge point the desired distance
	max_rotation	= Math.min( theta, phi );
})

function onMouseMove( e : MouseEvent ) {
	const Cx	= bounds.x + bounds.width  / 2;
	const Cy	= bounds.y + bounds.height / 2;

	const Dx	= e.x - Cx;
	const Dy	= e.y - Cy;

	const Px	= Dx / half_size.x; // Offset percent scaled to -1:1 with zero at the center
	const Py	= Dy / half_size.y;

	off = {
		x: Px,
		y: Py
	}
	rot = {
		// Note: Rotation about y is based on x position and vice versa
		  x: Py * max_rotation
		, y: Px * max_rotation
	}
}
function onMouseLeave( e : MouseEvent ) {
	rot = { x: 0, y: 0}
	off = { x: 0, y: 0}
}
</script>
<button
	bind:this={el}
	style = "--rot-x: {rot.x}; --rot-y: {rot.y}; --off-x: {off.x}; --off-y: {off.y}; --perspective: { largest_size }"
	on:mousemove  = { onMouseMove  }
	on:mouseleave = { onMouseLeave }
>
	<span class="material-symbol">
		<slot></slot>
	</span>
</button>

<style lang='scss'>
@use '@scss/lib/neumorphic';
@use '@scss/theme';


button {
	position:	relative;
	background:	none;
	border:		none;
	outline:	none;

	min-width:	20em;
	min-height:	20em;
	margin: 4em;

	cursor: pointer;

	color: theme.$col-text-light;
	
	@include neumorphic.slab( $height: 5px, $corner-radius: 10px, $base-curve: 5px, $lip-curve: 2px );

	& > *,
	&::after,
	&::before {
		transition-duration: 50ms;
		transition-timing-function: ease-out;
		transition-property:  left, top, right, bottom, border-radius, transform;
	}

	&:hover {
		@include neumorphic.slab-height( $height: 10px );
		
		// &::after {
		// 	transform:
		// 		perspective( calc( var( --perspective ) * 1px ) )
		// 		translateX( calc( var( --off-x ) * -2px ) )
		// 		translateY( calc( var( --off-y ) *  2px ) )
		// 		rotateX( calc( var( --rot-x) *  1rad ) )
		// 		rotateY( calc( var( --rot-y) * -1rad ) )
		// 	;
		// }
	}
	
	&:active {
		&::before {
			transform:
				scale3d( -1, -1, 1 )
			;
		}
	}
}
</style>