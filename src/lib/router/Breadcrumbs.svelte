<script lang="ts">
import { fade, fly, slide } from "svelte/transition";


import type { ArchiRouter, ArchiBreadcrumb} from "./RouterFrame.svelte";

// Properties
export let router	: ArchiRouter;			// The router to show breadcrumbs for
export let skipRoot	: boolean	= false;	// Should the first entry in the crumb stack be ignored?

// Members
let uri		: string			= null;
let crumbs	: ArchiBreadcrumb[]	= [];

function GetCrumbName( crumb : ArchiBreadcrumb )
{
	return crumb.name ?? crumb.path.match(/[^\/]+$/)[0];
}
function OnCrumbClick( crumb : ArchiBreadcrumb )
{
	router.GoToCrumb( crumb );
}

// router can be null or undefined at creation, so use the dynamic binding to subscribe to it once we have one
$: {
	if (router)
	{
		router.Location.subscribe   ( v => { uri = v;	 } );
		router.Breadcrumbs.subscribe( v => { 
			if (skipRoot)
			{
				crumbs = v.slice(1);
			}
			else
			{
				crumbs = v;
			}
		} );
	}
};

</script>

<ul>
	{#each crumbs as crumb}
	<li on:click="{() => OnCrumbClick(crumb)}"  transition:fly={{duration: 150, x: -50}}>
		<span>
			{GetCrumbName(crumb)}
		</span>
	</li>
	{/each}
</ul>

<style lang="scss">
	@use '../scss/branding/ArchiBranding.scss' as Archiact;
	ul
	{
		display: flex;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li
	{
		display: inline-block;
		
		margin: 0;
		padding: 0;

		font-weight: bolder;
		font-size: 1.2rem;

		cursor: pointer;

		&:not(:first-child)::before {
			content: ">";
			margin-left: 0.25rem;
			margin-right: 0.25rem;
		}

		& > span
		{
			border: solid 1px transparent;
			padding: 0.25rem;
			transition: all 150ms ease-out;

			&:hover
			{
				border-color: #FFF;//Archiact.$WHITE;
				border-radius: 0.25rem;
			}
		}
	}

</style>