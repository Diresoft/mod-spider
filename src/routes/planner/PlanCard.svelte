<script lang='ts'>
    import type { Plan } from "$lib/app/plan/Plan";
    import { createEventDispatcher } from "svelte";

	export let plan: Plan;
	const dispatch = createEventDispatcher();
</script>

<section>
	<img src="/covers/logo_white.png" alt="Profile Icon" />
	<header>{plan.name}</header>
	<p>{plan.description}</p>
	<actions>
		<button on:click={ ()=>dispatch( 'open',   plan ) }>&#xF4CB;</button>
		<button on:click={ ()=>dispatch( 'delete', plan ) }>&#xF5DE;</button>
	</actions>
</section>

<style lang="scss">
	@use 'sass:color' as color;
	@use '$scss/branding/index.scss' as branding;
	@use '$scss/util/index.scss' as util;
	section {
		display: grid;
		grid-template-areas:
		'icon title actions'
		'icon info actions'
		;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: 0.5fr 0.5fr;
		align-items: center;

		padding: 0.5em 0;

		img {
			width: 2em;
			grid-area: icon;
		}

		header {
			grid-area: title;
			margin: 0;

			max-width: 20em;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		
		p {
			grid-area: info;
			margin: 0;

			max-width: 20em;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			font-size: 0.9em;
			font-style: italic;
			font-weight: 200;
		}

		actions {
			grid-area: actions;
			list-style: none;
			padding: 0;

			margin-left: 0.5em;

			display: flex;
			flex-direction: row;

			button {
				@include util.button_group( branding.$primary, branding.$light );

				font-family: 'bootstrap-icons';
				display: inline-block;
			}
		}
	}
</style>