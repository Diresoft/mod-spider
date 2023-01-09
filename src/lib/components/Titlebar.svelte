<script lang='ts'>
import { appWindow } from '@tauri-apps/api/window'
import { onMount } from 'svelte';

let isMaximized = true;
async function toggleMaximize()
{
	appWindow.toggleMaximize();
	isMaximized = await appWindow.isMaximized(); // This isn't accurate till the first toggle anyway
}

</script>

<titlebar>
	<info data-tauri-drag-region>
		<img src="logo.png" class="logo" alt="Logo" />
		<title><slot></slot></title>
	</info>

	<menu>
		<slot name="menu"></slot>
	</menu>

	<space-fill data-tauri-drag-region />
	
	<action class='material-symbol' on:click={()=>appWindow.minimize()}>remove</action>
	{#if isMaximized }
		<action class='material-symbol' on:click={toggleMaximize}>crop_square</action>
	{:else}
		<action class='material-symbol flip' on:click={toggleMaximize}>filter_none</action>
	{/if}
	<action class='material-symbol close' on:click={()=>appWindow.close()}>close</action>
</titlebar>


<style lang="scss">
	@use '$scss/theme.scss' as theme;
	.flip {
		transform: rotate(180deg);
	}

	$bar-height: 1.6em;
	$info-margin: 0.25em;
	$bar-font-size: $bar-height - ($info-margin * 2);

	titlebar {
		position: relative;
		
		display:		flex;

		flex-direction:	row;
		align-items:	stretch;
		align-content:	space-between;

		overflow: hidden;
		background-color: theme.$col-frame;

		font-size: $bar-font-size;
		user-select: none;

		height: $bar-height;
		
		& > * {
			display: inline-block;
		}

		space-fill {
			flex-grow: 1;
		}

		info {
			display: inline-flex;
			flex-direction: row;

			margin: $info-margin;

			title {
				display: inline-block;
				font-size: $bar-font-size - $info-margin;
				margin-left: $info-margin;
			}
		}

		action {
			display: block;
			align-self: center;

			font-size: 1rem;
			padding: $info-margin * 2;

			&:hover {
				background-color: #ffffff;
				color: #222;
				cursor: default;
			}

			&.close:hover {
				background-color: #d13438;
			}
		}
	}
</style>