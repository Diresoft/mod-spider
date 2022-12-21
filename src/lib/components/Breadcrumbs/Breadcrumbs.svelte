<script lang='ts'>
	import { app } from '$lib/modules/app/application_context';
	import { btnAnchor } from '$lib/modules/util/helpers';
	import { fly } from 'svelte/transition';
	const crumbs = app.crumbs;

	export let break_style : boolean = false;
	
</script>

{#if break_style }
	<div>
		{#each $crumbs as crumb}
			<crumb on:click={ btnAnchor( crumb.href ) }>
				{#if crumb.icon && !crumb.postfix_icon}
					<i>{crumb.icon}</i>
				{/if}
				{crumb.text}
				{#if crumb.icon && crumb.postfix_icon}
					<i>{crumb.icon}</i>
				{/if}
			</crumb><i>navigate_next</i>
		{/each}
	</div>
{:else}
	<div>
		{#each $crumbs as crumb}
			<a href={crumb.href} class="chip border small">
				{#if crumb.icon && !crumb.postfix_icon}
					<i class="small">{crumb.icon}</i>
				{/if}
				{crumb.text}
				{#if crumb.icon && crumb.postfix_icon}
					<i class="small">{crumb.icon}</i>
				{/if}
			</a><i class="large">navigate_next</i>
		{/each}
	</div>
{/if}


<style lang="scss">
	a, crumb {
		cursor: pointer;
	}
	  a > i
	, crumb > i {
		user-select: none;
	}
	div > i:last-child {
		display: none;
	}
</style>