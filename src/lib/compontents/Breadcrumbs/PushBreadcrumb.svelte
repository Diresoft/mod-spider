<script lang="ts">
	import { crumbs } from "$lib/modules/app/application_context";
	import { onMount } from "svelte";


	export let href : string = window.location.href;
	export let text : string;
	export let icon : undefined | string = undefined;
	export let postfix_icon : boolean = false;

	onMount( () => {
		const crumb_data = { text, href, icon, postfix_icon };
		crumbs.update( (c) => {
			c.push( crumb_data );
			return c;
		})

		return () => {
			crumbs.update( (c) => {
				return c.filter( ( d ) => d !== crumb_data )
			})
		}
	})
</script>