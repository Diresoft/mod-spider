<script lang='ts'>

// Modules
import { setContext } from 'svelte';
import type { ArchiRoute } from './module';
import { ArchiRouterError, ArchiRouter, ArchiRouterFrameContextName } from './module';

// Properties
export let routes		: ArchiRoute[]	= [];

// Members
let visibleComponent	: any = null;			// The Svelte component that should be currently visible (I can't figure out the Typescript for this)
let visibleProps		: SvelteRestProps = null;	// The properties set on the navigation element that brought us to the visible component

// The router object that controls this element
export const myRouter = new ArchiRouter(routes);

// Subscribe to the visible route to change the rendered content when we navigate
myRouter.View.subscribe( ( val ) => 
{
	if ( !val ) return;
	try
	{
		if (val)
		{
			visibleComponent	= myRouter.GetNode(val.path).component(val.props);
			visibleProps		= val.props;
		}
	} catch(e)
	{
		if (e instanceof ArchiRouterError)
		{
			console.warn(e);
			visibleComponent = myRouter.GetNode(":/404").component();
			visibleProps = { 
				error_code: 404,
				error_message: `Page not found`,
				error_details: e.message
			};
		}
	}
})

// Expose the router to the context
setContext(ArchiRouterFrameContextName,	myRouter);

// Expose the navigate function director
export const Navigate = ArchiRouter.prototype.Navigate.bind(myRouter);


document.addEventListener("mouseup", (e) => {
	if ( e.button === 3 )
	{
		e.preventDefault();
		myRouter.GoBack();
	}
	else if ( e.button === 4 )
	{
		e.preventDefault();
		myRouter.GoForward();
	}
})

// Default navigate to root path
myRouter.Navigate(":", null, "Home");
</script>

<!-- Render the routed page with all props from the Navigate that brought us here as well as any extra props dropped on this element -->
{#if visibleComponent}
<svelte:component this={visibleComponent} {...visibleProps} />
{/if}