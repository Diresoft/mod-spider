<script lang='ts'>
import { getContext } from "svelte/internal";
import RouterFrame, { ArchiRouterFrameContextName, ArchiRouterError, ArchiRouter } from "./RouterFrame.svelte";

// Element Props
export let href			: string;
export let name			: string		= null;
export let target		: RouterFrame	= null;

const contextRouter = getContext(ArchiRouterFrameContextName) as ArchiRouter;
function handleClick(e)
{
	e.preventDefault();
	if (target)
	{
		target.Navigate(href, $$restProps, name);
	}
	else if (contextRouter)
	{
		contextRouter.Navigate(href, $$restProps, name);
	}
	else
	{
		throw new ArchiRouterError(`Null or undefined \`target\`/${ArchiRouterFrameContextName} in context`)
	}

}

</script>

<span on:click={handleClick}><slot>{name ?? href}</slot></span>

<style lang="scss">
	span
	{
		cursor: pointer;
	}
</style>