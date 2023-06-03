<script lang="ts">
    import type { LayoutData } from "./$types";

	export let data: LayoutData
	$: plan = data.plan;

	function browseForSplashImage()
	{
		console.warn( `SPLASH IMAGE SELECTION NOT IMPLEMENTED` );
	}

</script>

{#if !$plan}
	<span>loading...</span>
{:else}
	<hero>
		<splash>
			<img src="/covers/skyrim.jpg" alt=""/>
			<button on:click={browseForSplashImage}>&#xea98;</button>
		</splash>
		<input type='text' class='title' bind:value={$plan.name} />
		<textarea class='description' bind:value={$plan.description} />
	</hero>
	<slot />
{/if}

<style lang="scss">
	@use 'sass:color' as color;

	@use '$scss/branding/index.scss' as branding;
	@use '$scss/util/index.scss' as util;


	hero {
		display: grid;
		grid-template-areas:
			'guide guide'
			'splash title'
			'splash description'
		;
		grid-template-columns: 0.25fr 1fr min-content;
		margin: 10px;

		splash {
			grid-area: splash;
			position: relative;
			overflow: hidden;
			font-size: 0.9rem;

			border: solid 1px branding.$primary;
			border-right: none;
			border-radius: 10px;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;

			img {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate( -50%, -50% );
			}
			button {
				@include util.button( $padding: 0.25em );
				font-family: 'tabler-icons';
				position: absolute;
				bottom: 0.3em;
				right:  0.3em;

			}
		}
		input.title {
			grid-area: title;
			background: none;

			font-family: 'Inter';
			font-size: 1.5em;
			font-weight: 300;

			padding: 10px;


			color: branding.$light;
			outline: none;

			border: solid 1px branding.$primary;
			border-left: none;
			border-bottom: none;
			border-top-right-radius: 1em;
		}
		textarea.description {
			grid-area: description;
			background: none;

			font-family: 'Inter';
			font-size: 1em;
			font-weight: 400;

			padding: 10px;

			resize: vertical;

			color: branding.$light;
			outline: none;

			border: solid 1px branding.$primary;
			border-left: none;
			border-bottom-right-radius: 1em;
		}
		button.guide {
			grid-area: guide;
			@include util.button();
			border-top: none;
			border-top-left-radius: 0;
			border-top-right-radius: 0;

			font-size: 1.3em;

			icon {
				font-family: 'tabler-icons';
				font-size: 1.5em;
				font-weight: 100;
			}
			span {
				font-family: 'Inter';
				font-weight: 700;
			}
		}
	}

</style>