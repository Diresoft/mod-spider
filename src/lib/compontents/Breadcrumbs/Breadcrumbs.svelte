<script lang='ts'>
	import { crumbs } from '$lib/modules/app/application_context';
	import { fly } from 'svelte/transition';
</script>

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

<style lang="scss">
	a > i {
		user-select: none;
	}
	div > i:last-child {
		display: none;
	}
</style>