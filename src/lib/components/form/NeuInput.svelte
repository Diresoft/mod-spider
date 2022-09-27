<!-- <script lang="ts">
	export let type		: string	= "text";
	export let value	: any		= null;

	function handleInput( e : any )
	{
		const el : HTMLInputElement = (( e as InputEvent).target as HTMLInputElement);
		if ( type === "checkbox" )
		{
			value = el.checked;
		}
		else
		{
			value = el.value;
		}
	}
</script>
<shim data-type={type}>
	<input
		type={type}
		on:input={handleInput}
		{...$$restProps}
	/>
</shim>

<style lang="scss">
@use '@scss/lib/neumorphic.scss';
@use '@scss/theme';

shim {
	position:	relative;
	display: inline-block;

	@include neumorphic.slab();
	@include neumorphic.slab-height( $height: -15px );

	&[data-type=text] {
		@include neumorphic.slab-corner( $r: 10px, $h: 5px );
		@include neumorphic.slab-curve( $base-curve: 3px, $lip-curve: 1px );
		&:hover {
			@include neumorphic.slab-height( $height: -20px );
		}
	}

	input {
		position:	relative;
		display: inline-block;

		background:	none;
		outline:	none;
		border:		none;

		color: theme.$col-text-light;

		&[type=text] {
			
		}
	}
}
</style> -->