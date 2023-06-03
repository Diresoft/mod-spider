<script lang='ts'>
    import { onDestroy } from "svelte";
    import type { ComponentType, SvelteComponentTyped } from "svelte";
    import { chrome_info } from "./+layout.svelte";
    import type { BreadcrumbInfo } from "$lib/app/Context";

	export let icon: any;
	export let name: string;

	export let uri:     string;
	export let context: undefined|any    = undefined;
	
	let old_crumb: BreadcrumbInfo|undefined = undefined;
	$: {
		let crumb_info = { icon, iconComponent: icon as ComponentType<SvelteComponentTyped>, name, uri, context } as BreadcrumbInfo;
		if ( old_crumb !== undefined )
		{
			remove_crumb( old_crumb );
		}
		add_crumb( crumb_info);
		old_crumb = crumb_info;
	}

	function add_crumb( crumb: BreadcrumbInfo )
	{
		chrome_info.update( ci => {
			ci.breadcrumbs.push( crumb );
			return ci;
		})
	}
	function remove_crumb( crumb: BreadcrumbInfo )
	{
		chrome_info.update( ci => {
			ci.breadcrumbs = ci.breadcrumbs.filter( v => v !== crumb );
			return ci;
		})
	}

	onDestroy( () => {
		if ( old_crumb !== undefined )
		{
			remove_crumb( old_crumb );
		}
	})
</script>